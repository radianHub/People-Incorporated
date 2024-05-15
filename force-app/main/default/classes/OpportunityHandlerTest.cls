@isTest
public class OpportunityHandlerTest {
  static testMethod void testOpportunityHandlerWithValidData() {
    Account testAccount = new Account(
      Name = 'Test Account',
      BillingStreet = '123 Main St',
      BillingCity = 'Metropolis',
      BillingState = 'CA',
      BillingPostalCode = '12345'
    );
    insert testAccount;

    Opportunity testOpp = new Opportunity(
      Name = 'Test Opportunity',
      AccountId = testAccount.Id,
      CloseDate = Date.today(),
      Amount = 10000,
      StageName = 'Closed Won'
    );
    insert testOpp;

    String letterTemplate = 'Dear «Salutation», «Organization_Name» at «Address_line_1», «City», «State», «ZIP_Code». Donation: «Amount», received on «Gift_date». «Addresses»';

    Test.setCurrentPage(Page.EmailTemplateGenerator);
    ApexPages.currentPage().getParameters().put('id', testOpp.Id);

    Test.startTest();
    OpportunityHandler handler = new OpportunityHandler();
    Test.stopTest();

    handler.letter = letterTemplate
      .replace('«Date»', Date.today().format())
      .replace('«Addresses»', testOpp.Name)
      .replace('«Organization_Name»', testAccount.Name)
      .replace('«Address_line_1»', testAccount.BillingStreet)
      .replace('«City»', testAccount.BillingCity)
      .replace('«State»', testAccount.BillingState)
      .replace('«ZIP_Code»', testAccount.BillingPostalCode)
      .replace('«Salutation»', 'Mr./Ms.')
      .replace('«Amount»', String.valueOf(testOpp.Amount))
      .replace('«Gift_date»', testOpp.CloseDate.format())
      .replace(';', '<br/>');

    System.assertNotEquals(null, handler.opp, 'Opportunity should not be null');
    System.assertNotEquals(null, handler.letter, 'Letter should not be null');
    System.assert(
      handler.letter.contains('Test Opportunity'),
      'Letter should contain the opportunity name'
    );
    System.assert(
      handler.letter.contains('Test Account'),
      'Letter should contain the account name'
    );

    PageReference pageRef = handler.navigateToPage();
    System.assertEquals(
      Page.EmailTemplateGenerator.getUrl(),
      pageRef.getUrl(),
      'Should navigate to the correct page'
    );
  }
}