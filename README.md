# Keycloak CIE ID providers configuration client
A NodeJS client to automatically configure a Keycloak instance already setup with [keycloak-cieid-provider](https://github.com/lscorcia/keycloak-cieid-provider)

* creates Keycloak configuration for CIE ID Testing (https://preproduzione.idserver.servizicie.interno.gov.it/idp/shibboleth?Metadata)
* creates Keycloak configuration for CIE ID Production (https://idserver.servizicie.interno.gov.it/idp/shibboleth?Metadata)

![image](https://user-images.githubusercontent.com/2743637/213274003-23f10d6d-8092-418c-bccf-9df100884312.png)

## Requirements
Docker or `node` and `npm`

## Configuration
Copy `.env-example` to `.env`, configure it and wipe out the comments
If you want to have official CIE Testing enabled, set the following `.env` file properties

```
createCiedTestingIdP = true 
```

If you want to use [spid-sp-test](https://github.com/italia/spid-sp-test), set the following `.env` file properties

```
createSpidSpTestIdP = true
spidSpTestIdPMetadataURL = https://yourdomain.com/spid-sp-test.xml
```

Make sure you can uploaded the spid-sp-test metadata.xml to a Keycloak-reachable URL as above. The XML file can be generated with 

    docker run --rm -it italia/spid-sp-test --idp-metadata > spid-sp-test.xml

## Running the tool
### Docker
Easiest way by leveraging Docker:

    make

### Without Docker
If you have NodeJS installed 
```
npm install
npm run create-idps
```

## Authentication flow
By default, the new IdPs are created with a SPID-specific Authentication Flow, as per https://github.com/italia/spid-keycloak-provider/wiki/Configuring-the-Authentication-Flow - this is named `First Broker Login (SPID)` (ref. [idpmodel.json#L11](https://github.com/nicolabeghin/keycloak-cieid-provider-configuration-client/blob/master/template/idpmodel.json#L11)) and must be created before running the client.

<img width="1455" alt="image" src="https://user-images.githubusercontent.com/2743637/212534098-d6add32d-db1b-4c63-b203-f37f78fee8f9.png">


## Credits
* forked from https://github.com/GermanoGiudici/keycloak-spid-provider-configuration-client (kudos to @GermanoGiudici)
* this project is released under the Apache License 2.0, same as the main Keycloak package.
