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
    url: config.keycloakServerBaseURL + '/realms/' + config.adminRealm + '/protocol/openid-connect/token',
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
        let data = JSON.stringify({"providerId": "cieid-saml", "fromUrl": idPsMetadataUrl});
        let axiosConfig = {
            httpsAgent : agent,
            method: 'post',
            url: config.keycloakServerBaseURL + '/admin/realms/' + config.realm + '/identity-provider/import-config',
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
            url: config.keycloakServerBaseURL + '/admin/realms/' + config.realm + '/identity-provider/instances',
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
            url: config.keycloakServerBaseURL + '/admin/realms/' + config.realm + '/identity-provider/instances/' + idPAlias,
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
            url: config.keycloakServerBaseURL + '/admin/realms/' + config.realm + '/identity-provider/instances',
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
        url: config.keycloakServerBaseURL + '/realms/' + config.realm + '/broker/' + encodeURIComponent(idpAlias) + '/endpoint/descriptor',
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
            url: config.keycloakServerBaseURL + '/admin/realms/' + config.realm + '/identity-provider/instances/' + idPAlias + '/mappers',
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
    if (error.response) {
        const {status, statusText, data, config: reqConfig} = error.response;
        console.error(`HTTP ${status} ${statusText || ''} on ${reqConfig?.method?.toUpperCase?.()} ${reqConfig?.url}`);
        if (data && typeof data === 'object') {
            if (data.errorMessage) console.error('errorMessage:', data.errorMessage);
            if (data.error) console.error('error:', data.error);
            if (data.error_description) console.error('error_description:', data.error_description);
            console.error('response body:', JSON.stringify(data));
        } else if (data) {
            console.error('response body:', String(data));
        }
        return;
    }
    if (error.request) {
        console.error(`No response received (network/timeout) on ${error.config?.method?.toUpperCase?.()} ${error.config?.url}`);
        console.error('cause:', error.code || error.message);
        return;
    }
    console.error('Request setup error:', error.message);
}
