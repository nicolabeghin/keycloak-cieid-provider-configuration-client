require('dotenv').config()
const slugify = require('slugify')
const fs = require('fs')

const config = {
    ...process.env
}

const SPID_PREFIX = 'CIED ';
const SPID_ALIAS_PREFIX = 'cied-';
exports.config = config

exports.usernameMapperTemplate = require('../template/username_mm.json')
exports.lastnameMapperTemplate = require('../template/lastname_mm.json')
exports.firstnameMapperTemplate = require('../template/firstname_mm.json')

exports.taxIdMapperTemplate = require('../template/taxid_mm.json');
exports.dateOfBirthMapperTemplate = require('../template/dateofbirth_mm.json');

exports.patchTemplate = function (templateFilePath) {
    let templateString = fs.readFileSync(templateFilePath).toString();
    return templateString.replace(/%REALM%/g, config.realm)
        .replace(/%KEYCLOAKSERVERBASEURL%/g, config.keycloakServerBaseURL)
}

exports.enrichIdpWithConfigData = function (idp) {
    let cleanedupSpidName = idp.entity_name.replace(' ID', '');
    idp.alias = slugify(SPID_ALIAS_PREFIX + cleanedupSpidName).toLowerCase();
    idp.displayName = SPID_PREFIX + cleanedupSpidName;
    idp.config = {
        otherContactPhone: config.otherContactPhone,
        otherContactEmail: config.otherContactEmail,
        otherContactIpaCode: config.otherContactIpaCode,
        organizationNames: config.organizationNames,
        organizationDisplayNames: config.organizationDisplayNames,
        organizationUrls: config.organizationUrls,
        attributeConsumingServiceName: config.attributeConsumingServiceName,
        // ipaCategory: '',
        administrativeContactCompany: config.organizationNames.split("|")[1],
        administrativeContactIpaCode: config.otherContactIpaCode,
        // administrativeContactVatNumber: '',
        // administrativeContactFiscalCode: '',
        // administrativeContactNace2Codes: '',
        administrativeContactMunicipality: config.organizationMunicipality,
        // administrativeContactProvince: '',
        administrativeContactCountry: 'IT',
        administrativeContactPhone: config.otherContactPhone,
        administrativeContactEmail: config.otherContactEmail
        // technicalContactCompany: '',
        // technicalContactVatNumber: '',
        // technicalContactFiscalCode: '',
        // technicalContactNace2Codes: '',
        // technicalContactMunicipality: '',
        // technicalContactProvince: '',
        // technicalContactCountry: '',
        // technicalContactPhone: '',
        // technicalContactEmail: ''
    };
    return idp;
}