public with sharing class paymentProcessorController {

    @AuraEnabled(cacheable=true)
    public static Donation_Component__c getSettings(){
        return Donation_Component__c.getOrgDefaults();
    }

}