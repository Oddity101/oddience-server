const SibApiV3Sdk = require('sib-api-v3-sdk');


module.exports = async (email, fName, lName) => {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.SIB_API_KEY;
    
    let apiInstance = new SibApiV3Sdk.ContactsApi();
    
    let createContact = new SibApiV3Sdk.CreateContact();
    
    createContact.email = email;
    createContact.attributes = {"FIRSTNAME":fName, "LASTNAME":lName}
    createContact.listIds = [3]
    
    apiInstance.createContact(createContact).then(function(data) {
      console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    }, function(error) {
      console.error(error);
    });
}