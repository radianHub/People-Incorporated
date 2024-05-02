global with sharing class ClosedWonOpportunities {
    global String accId { get; set; }
    global List<Opportunity> opportunities { 
        get {
            if(opportunities == null) {
				opportunities = [SELECT Id, Name, CloseDate, Amount, AccountId FROM Opportunity WHERE AccountId = :accId AND StageName = 'Closed Won'];                
            }
            return opportunities;
    	} 
        private set; 
    }
    global Decimal totalAmount { 
        get {
            if(totalAmount == null) {
                totalAmount = 0;
                for (Opportunity opp : opportunities) {
                    if(opp.Amount == null) {
                       totalAmount += 0;
                    } else {
                       totalAmount += opp.Amount; 
                    }
                }
            }
        	return totalAmount;
    	}
        private set; 
    }
    
//    global ClosedWonOpportunities() {
//        this.totalAmount = 0;
//        //this.accId = '001TI000007sEpxYAE';
//        this.opportunities = new List<Opportunity>();
//        this.opportunities = [SELECT Id, Name, CloseDate, Amount, AccountId FROM Opportunity WHERE AccountId = :this.accId AND StageName = 'Closed Won'];
//        for (Opportunity opp : this.opportunities) {
//            if(opp.Amount == null) {
//               this.totalAmount += 0;
//            } else {
//               this.totalAmount += opp.Amount; 
//            }
            
//        }
//    }
}