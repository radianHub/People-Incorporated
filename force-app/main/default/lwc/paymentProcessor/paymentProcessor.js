import { LightningElement, api, wire } from "lwc";
import { CloseActionScreenEvent } from 'lightning/actions';

import getDonationAmounts from '@salesforce/apex/paymentProcessorController.getDonationAmounts';

export default class PaymentProcessor extends LightningElement {
	@api recordId;
	donationAmounts;	
	givingType;


	closeModal() {
		this.dispatchEvent(new CloseActionScreenEvent());
	}

	// # LIFECYCLE HOOKS

	// # APEX

	@wire(getDonationAmounts)
	wiredDonations({error, data}) {
		if (data) {
			console.log(data)
			this.donationAmounts = {
				monthly: null,
				once: null
			}
			data.forEach(e => {
				let amountArr = []
				if (e.Auto_Calculate__c) {
					let currentAmount = e.Starting_Amount__c
					for (let i = 0; i < 6; i++) {						
						amountArr.push(currentAmount)
						currentAmount += currentAmount * (e.Percentage_to_Auto_Calculate__c * 0.01)
					}
				} else {
					amountArr.push(
						e.Giving_Amount_1__c,
						e.Giving_Amount_2__c,
						e.Giving_Amount_3__c,
						e.Giving_Amount_4__c,
						e.Giving_Amount_5__c,
						e.Giving_Amount_6__c
					)
				}

				if (e.DeveloperName === 'Monthly') {
					this.donationAmounts.monthly = amountArr
				} else if (e.DeveloperName === 'One_Time') {
					this.donationAmounts.once = amountArr
				}
			});
			this.givingType = 'once';
			console.log(this.donationAmounts);
		} else if (error) {
			console.log(error)
		}
	}

	// # PRIVATE METHODS

	// # HANDLERS

	// # GETTERS/SETTERS

	get options() {
		return [
			{ label: 'One-Time', value: 'once' },
			{ label: 'Monthly', value: 'monthly' }
		]
	}

	get typeOnce() {
		return this.givingType === 'once'
	}
}