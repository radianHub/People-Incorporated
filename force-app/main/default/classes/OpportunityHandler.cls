public class OpportunityHandler {
  public Opportunity opp { get; private set; }
  public String letter { get; set; }
  private final Id oppId;

  public OpportunityHandler() {
    oppId = ApexPages.currentPage().getParameters().get('id');
    if (oppId != null) {
      loadOpportunity();
      loadAcknowledgementLetter();
    }
  }

  private void loadOpportunity() {
    opp = [
      SELECT
        Id,
        Name,
        Account.Name,
        CloseDate,
        Amount,
        Account.BillingStreet,
        Account.BillingCity,
        Account.BillingState,
        Account.BillingPostalCode
      FROM Opportunity
      WHERE Id = :oppId
    ];
  }

  private void loadAcknowledgementLetter() {
    Acknowledgement_Letter__mdt template = [
      SELECT Label, Letter__c
      FROM Acknowledgement_Letter__mdt
      LIMIT 1
    ];

    if (
      template != null &&
      template.Letter__c != null &&
      opp != null &&
      opp.Account != null
    ) {
      letter = template.Letter__c
        .replace('«Date»', Date.today().format())
        .replace('«Addresses»', opp.Name != '' ? opp.Name : '')
        .replace(
          '«Organization_Name»',
          opp.Account.Name != null ? opp.Account.Name : ''
        )
        .replace(
          '«Address_line_1»',
          opp.Account.BillingStreet != null ? opp.Account.BillingStreet : ''
        )
        .replace(
          '«City»',
          opp.Account.BillingCity != '' ? opp.Account.BillingCity : ''
        )
        .replace(
          '«State»',
          opp.Account.BillingState != null ? opp.Account.BillingState : ''
        )
        .replace(
          '«ZIP_Code»',
          opp.Account.BillingPostalCode != null
            ? opp.Account.BillingPostalCode
            : ''
        )
        .replace('«Salutation»', 'Mr./Ms.')
        .replace(
          '«Amount»',
          opp.Amount != null ? String.valueOf(opp.Amount) : '0'
        )
        .replace(
          '«Gift_date»',
          opp.CloseDate != null ? opp.CloseDate.format() : ''
        )
        .replace(';', '<br/>');
    } else {
      System.debug('One of the required fields is null.');
    }
  }

  public PageReference navigateToPage() {
    PageReference pageRef = Page.EmailTemplateGenerator;
    return pageRef;
  }
}