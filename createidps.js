const {from, of, concat} = require('rxjs')
const {map, mergeMap, take} = require('rxjs/operators')
const {config, patchTemplate, enrichIdpWithConfigData} = require('./src/common')
const {
    httpCallKeycloakImportConfig,
    httpCallKeycloakCreateIdP,
    httpCallKeycloakDeleteIdP,
    httpCallKeycloakCreateAllMappers
} = require('./src/http')


const idPTemplate = JSON.parse(patchTemplate('./template/idpmodel.json'))

var getOfficialSpididPsMetadata$ = of(enrichIdpWithConfigData({
    entity_name: "Production",
    metadata_url: config.cieidIdPMetadataURL,
    enabled: false
}));

if (config.createCiedTestingIdP === 'true') {
    let spidDemoIdPOfficialMetadata = {
        entity_name: config.ciedTestingIdPAlias,
        metadata_url: config.cieidTestingIdPMetadataURL,
        enabled: true
    }

    getOfficialSpididPsMetadata$ = concat(getOfficialSpididPsMetadata$, of(enrichIdpWithConfigData(spidDemoIdPOfficialMetadata)))

}

//getOfficialSpididPsMetadata$.subscribe(console.log)

//richiesta cancellazione degli idPs da keycloak
var deleteKeycloakSpidIdPs$ = getOfficialSpididPsMetadata$
    .pipe(mergeMap(spidIdPOfficialMetadata => from(httpCallKeycloakDeleteIdP(spidIdPOfficialMetadata.alias).then(httpResponse => spidIdPOfficialMetadata))))


//richiesta conversione in import-config model [idP,import-config-response]
var getKeycloakImportConfigModels$ = deleteKeycloakSpidIdPs$
    .pipe(mergeMap(spidIdPOfficialMetadata => from(httpCallKeycloakImportConfig(spidIdPOfficialMetadata.metadata_url).then(httpResponse => [spidIdPOfficialMetadata, httpResponse.data]))))

//trasformazione ed arricchimento => modello per creare l'idP su keycloak
var enrichedModels$ = getKeycloakImportConfigModels$
    .pipe(map(spidIdPOfficialMetadataWithImportConfigModel => {
        let [idPOfficialMetadata, importConfigModel] = spidIdPOfficialMetadataWithImportConfigModel
        importConfigModel.validateSignature = true; // override import config from metadata
        importConfigModel.wantAuthnRequestsSigned = true; // override import config from metadata
        let configIdp = {...idPTemplate.config, ...importConfigModel, ...idPOfficialMetadata.config}
        let firstLevel = {
            alias: idPOfficialMetadata.alias,
            displayName: idPOfficialMetadata.displayName,
            enabled: idPOfficialMetadata.enabled
        }
        let merged = {...idPTemplate, ...firstLevel}
        merged.config = configIdp
        return merged
    }))

//creazione dello spid idP su keycloak
var createSpidIdPsOnKeycloak$ = enrichedModels$
    .pipe(mergeMap(idPToCreateModel => from(httpCallKeycloakCreateIdP(idPToCreateModel).then(httpResponse => [idPToCreateModel.alias, httpResponse]))))

//creazione dei mappers per lo spid id
var createKeycloackSpidIdPsMappers$ = createSpidIdPsOnKeycloak$.pipe(mergeMap(idPAliasWithHttpCreateResponse => {
    let [alias, createResponse] = idPAliasWithHttpCreateResponse
    return from(httpCallKeycloakCreateAllMappers(alias).then(response => {
        return {alias, create_response: createResponse, mapper_response: response}
    }))
}))


createKeycloackSpidIdPsMappers$.subscribe(console.log)
