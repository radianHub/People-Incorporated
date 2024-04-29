public with sharing class paymentProcessorController {

    @AuraEnabled(cacheable=true)
    public static Donation_Component__c getSettings(){
        return Donation_Component__c.getOrgDefaults();
    }

    @AuraEnabled
    public static void savePaymentIntent(String data){
        try {
            PaymentData d = (PaymentData) JSON.deserializeStrict(data, PaymentData.class);
            System.debug(d);

            Contact honor;
            if (d.honor.hasHonor) {
                honor = new Contact(
                    RecordTypeId = [SELECT Id FROM RecordType WHERE SObjectType = 'Contact' AND DeveloperName = 'Standard'].Id,
                    FirstName = d.honor.FirstName,
                    LastName = d.honor.LastName
                );
                if (d.honor.honorType == 'memorial') {
                    honor.Email = d.honor.Email;
                    honor.Phone = d.honor.Phone;
                    honor.MailingStreet = d.honor.Street;
                    honor.MailingCity = d.honor.City;
                    honor.MailingState = d.honor.State;
                    honor.MailingPostalCode = d.honor.Zip;
                }

                insert honor;
            }

            Opportunity opp;
            if (d.type == 'payment') {
                opp = new Opportunity(
                    Name = 'Pending Donation - ' + d.stripeId,
                    StageName = 'Pledged',
                    CloseDate = Date.today(),
                    Amount = d.amount,
                    RecordTypeId = d.amount >= 1000 
                    ? [SELECT Id FROM RecordType WHERE SObjectType = 'Opportunity' AND DeveloperName = 'MajorGift'].Id
                    : [SELECT Id FROM RecordType WHERE SObjectType = 'Opportunity' AND DeveloperName = 'Donation'].Id,
                    Stripe_Transaction_Id__c = d.stripeId
                );
                insert opp;
            }

            OpportunityContactRole conRole = new OpportunityContactRole(
                ContactId = honor.Id,
                OpportunityId = opp.Id,
                Role = 'Honoree'
            );
            insert conRole;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private class PaymentData {
        String stripeId;
        Integer amount;
        String status;
        List<String> paymentMethod;
        String paymentStatus;
        String type;
        Long expires;
        HonoreeData honor;
    }

    private class HonoreeData {
        String FirstName;
        String LastName;
        String Street;
        String City;
        String State;
        String Zip;
        String Email;
        String Phone;
        Boolean hasHonor;
        String honorType;
    }
}