public class OpportunityHandler {
	public String customSettingValue { get; set; }
    
    public OpportunityHandler() {
        customSettingValue = npe03__Recurring_Donations_Settings__c.getInstance().Donation_Acknowledgements__c ;
    }

    public PageReference navigateToPage() {
        PageReference pageRef = Page.EmailTemplateGenerator;
        // pageRef.setRedirect(true); // Set to true if you want to redirect
        return pageRef;
    }
}