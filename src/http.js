const {config} = require('./common')
const qs = require('qs')
const axios = require('axios')
const https = require('https')
const {
  usernameMapperTemplate,
  lastnameMapperTemplate,
  firstnameMapperTemplate,
  taxIdMapperTemplate,
  dateOfBirthMapperTemplate,
  patchTemplate
} = require('./common')

const agent = new https.Agent({
    rejectUnauthorized: false
});

const tokenConfig = {
    httpsAgent : agent,
    method: 'post',
    url: config.keycloakServerBaseURL + '/auth/realms/' + config.adminRealm + '/protocol/openid-connect/token',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: qs.stringify({
        'client_id': config.adminClientId,
        'username': config.adminUsername,
        'password': config.adminPwd,
        'grant_type': 'password'
    })
};

const httpGrabKeycloaktoken = function () {
    return axios(tokenConfig)
        .then(response => response.data.access_token)
        .catch(function (error) {
            console.error('Error retrieving Keycloak token');
            handleHttpError(error);
        });
}

exports.httpGrabKeycloaktoken = httpGrabKeycloaktoken

exports.httpCallKeycloakImportConfig = function (idPsMetadataUrl) {
    return httpGrabKeycloaktoken().then(token => {
        let data = JSON.stringify({"providerId": "spid", "fromUrl": idPsMetadataUrl});
        let axiosConfig = {
            httpsAgent : agent,
            method: 'post',
            url: config.keycloakServerBaseURL + '/auth/admin/realms/' + config.realm + '/identity-provider/import-config',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: data
        };
        return axios(axiosConfig)
            .catch(function (error) {
                console.error('Error importing IdP configuration from metadata '+idPsMetadataUrl);
                handleHttpError(error);
            });
    })

}


exports.httpCallKeycloakCreateIdP = function (idPModel) {
    return httpGrabKeycloaktoken().then(token => {
        let data = JSON.stringify(idPModel);
        let axiosConfig = {
            httpsAgent : agent,
            method: 'post',
            url: config.keycloakServerBaseURL + '/auth/admin/realms/' + config.realm + '/identity-provider/instances',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: data
        };
        return axios(axiosConfig)
            .catch(function (error) {
                console.error('Error creating IdP '+idPModel.alias);
                handleHttpError(error);
            });
    })
}


exports.httpCallKeycloakDeleteIdP = function (idPAlias) {
    return httpGrabKeycloaktoken().then(token => {
        let axiosConfig = {
            httpsAgent : agent,
            method: 'delete',
            url: config.keycloakServerBaseURL + '/auth/admin/realms/' + config.realm + '/identity-provider/instances/' + idPAlias,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        };
        return axios(axiosConfig)
            .catch(function (error) {
                console.error('Error deleting IdP '+idPAlias);
                handleHttpError(error);
            });
    })
}

exports.httpCallKeycloakGetIpds = function () {
    return httpGrabKeycloaktoken().then(token => {
        let axiosConfig = {
            httpsAgent : agent,
            method: 'get',
            url: config.keycloakServerBaseURL + '/auth/admin/realms/' + config.realm + '/identity-provider/instances',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        };
        return axios(axiosConfig)
            .catch(function (error) {
                handleHttpError(error);
            });
    })
}


exports.httpCallKeycloakGetIpdDescription = function (idpAlias) {
    let axiosConfig = {
        httpsAgent : agent,
        method: 'get',
        url: config.keycloakServerBaseURL + '/auth/realms/' + config.realm + '/broker/' + encodeURIComponent(idpAlias) + '/endpoint/descriptor',
    };
    return axios(axiosConfig)
        .catch(function (error) {
            handleHttpError(error);
        });

}


exports.httpCallKeycloakCreateAllMappers = function (idPAlias) {
    return Promise.all([
        httpCallKeycloakCreateMapper(idPAlias, usernameMapperTemplate),
        httpCallKeycloakCreateMapper(idPAlias, lastnameMapperTemplate),
        httpCallKeycloakCreateMapper(idPAlias, firstnameMapperTemplate),
        httpCallKeycloakCreateMapper(idPAlias, taxIdMapperTemplate),
        httpCallKeycloakCreateMapper(idPAlias, dateOfBirthMapperTemplate)
    ])
}

const httpCallKeycloakCreateMapper = function (idPAlias, mapperModel) {
    return httpGrabKeycloaktoken().then(token => {
        mapperModel.identityProviderAlias = idPAlias
        let data = JSON.stringify(mapperModel);
        let axiosConfig = {
            httpsAgent : agent,
            method: 'post',
            url: config.keycloakServerBaseURL + '/auth/admin/realms/' + config.realm + '/identity-provider/instances/' + idPAlias + '/mappers',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: data
        };
        return axios(axiosConfig)
            .catch(function (error) {
                handleHttpError(error);
            });
    })
}

const handleHttpError = function(error) {
    if (undefined !== error.response.data.errorMessage) {
        console.error(error.response.data.errorMessage);
        return;
    }
    if (undefined !== error.response.data.error) {
        console.error(error.response.data.error);
        return;
    }
}