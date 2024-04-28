public with sharing class paymentProcessorController {

    @AuraEnabled(cacheable=true)
    public static Donation_Component__c getSettings(){
        return Donation_Component__c.getOrgDefaults();
    }

    @AuraEnabled
    public static void savePayment(String data){
        try {
            PaymentData d = (PaymentData) JSON.deserializeStrict(data, PaymentData.class);
            System.debug(d);
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
    }
}