import { LightningElement, api, wire } from "lwc";
import { CurrentPageReference } from 'lightning/navigation';

import getDonationAmounts from '@salesforce/apex/DonationSelectionController.getDonationAmounts';
import getProcessingFee from '@salesforce/apex/DonationSelectionController.getProcessingFee';
import getSettings from '@salesforce/apex/DonationSelectionController.getSettings';

export default class DonationSelection extends LightningElement {
	@api headerColor;
	@api headerTextColor;
	campaignId;
	settings;
	processingFee;
	donationAmounts;	
	givingType;
	givingInterval;
	recurFreq;
	showFreq = false;
	honor = false;
	honorSelection;
	honoree = {};
	donationAmt = 0;
	addFee = false;

	// # LIFECYCLE HOOKS
	
	connectedCallback() {
		this.getProcessingFee()
		this.getSettings()
		this.getDonationAmounts()
		this.campaignId = this.currentPageReference.state.c__campaign
	}

	// # APEX

	@wire(CurrentPageReference)
	currentPageReference;

	getProcessingFee() {
		getProcessingFee()
			.then((r) => {
				this.processingFee = r;
			})
			.catch((e) => {
				console.log(e);
			})
	}

	getSettings() {
		getSettings()
		.then((r) => {this.settings = r})
		.catch((e) => console.log(e))
	}

	getDonationAmounts() {
		getDonationAmounts()
			.then((r) => {
				this.donationAmounts = {
					month: null,
					once: null
				}
				r.forEach(e => {
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
						this.donationAmounts.month = amountArr
					} else if (e.DeveloperName === 'One_Time') {
						this.donationAmounts.once = amountArr
					}
				});
				this.givingType = 'once'
				this.recurFreq = 'month'
				console.log(this.donationAmounts)
			})
			.catch((e) => {
				console.log(e);
			})
	}

	// # PRIVATE METHODS

	unfocusBtn(btn) {
		btn.classList.remove('slds-button_brand')
		btn.classList.add('slds-button_neutral')
	}

	focusBtn(btn) {
		btn.classList.remove('slds-button_neutral')
		btn.classList.add('slds-button_brand')
	}

	validate() {
		const validLI = [...this.template.querySelectorAll('.honorInfo lightning-input')]
		.reduce((isValid, inp) => {
			inp.reportValidity()
			let valid = inp.checkValidity()

			return isValid && valid
		}, true)

		const validLCB = [...this.template.querySelectorAll('.honorInfo lightning-combobox')]
		.reduce((isValid, inp) => {
			inp.reportValidity()
			let valid = inp.checkValidity()

			return isValid && valid
		}, true)	
	
		if (validLI && validLCB) {
			const li = [...this.template.querySelectorAll('.honorInfo lightning-input')]
			.forEach(e => {
				this.honoree[e.name] = e.value
			})
			const lcb = [...this.template.querySelectorAll('.honorInfo lightning-combobox')]
			.forEach(e => {
				this.honoree[e.name] = e.value
			})

			this.honoree = {
				...this.honoree,
				hasHonor: this.honor,
				honorType: this.honorSelection
			}
		}

		return validLI && validLCB
	}

	checkoutWithStripe() {	
		let params = {
			'success_url': window.location.origin, // Will be set in a custom setting
			'cancel_url': window.location.origin, // Will be set in a custom setting
			'line_items[0][price_data][unit_amount]': Number(this.total) * 100,
			'line_items[0][quantity]': 1,
			'line_items[0][price_data][currency]': 'usd',
			'line_items[0][price_data][product_data][name]': 'Donation',
			'phone_number_collection[enabled]': true,
			'billing_address_collection': 'required',
			'mode': this.givingInterval.isRecurring ? 'subscription' : 'payment',
			'payment_method_types[0]': 'card',
			'metadata[campaignId]': this.campaignId ? this.campaignId : null
		}

		if (this.givingInterval.isRecurring) {
			params = {
				...params,
				'line_items[0][price_data][recurring][interval]': this.givingInterval.interval,
				'line_items[0][price_data][recurring][interval_count]': this.givingInterval.intervalCount
			}
		}

		if (this.honoree) {
			params = {
				...params,
				'metadata[honoree]': JSON.stringify(this.honoree)
			}
		}

		let body = new URLSearchParams(Object.entries(params)).toString()

		const response = fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Bearer ${this.settings.Stripe_API_Key__c}`,
				'Accept-Encoding': "gzip, deflate, br'",
				Accept: '*/*',
			},
			body: body
		})
		.then(resp => resp.json())
		.then(repos => {
			console.log(repos);
			window.open(repos.url, '_blank')
		})
	}

	// # HANDLERS

	clickHonorCheckBox(e) {
		this.honor = e.detail.checked
		if (this.honor) {
			this.honorSelection = 'honor'
		}
	}

	honorGroupChanged(e) {
		this.honorSelection = e.detail.value
	}

	clickDonationTypeBtn(e) {
		this.template.querySelectorAll('.typeBtn').forEach(i => {
			if (i.classList.contains('slds-button_brand')) {
				this.unfocusBtn(i)			
			}
		})

		let btn = this.template.querySelector('#' + e.currentTarget.id)
		this.focusBtn(btn)
		
		this.givingType = e.currentTarget.value;
		this.showFreq = this.givingType === 'recur' ? true : false
	}

	clickFreqTypeBtn(e) {
		this.template.querySelectorAll('.freqBtn').forEach(i => {
			if (i.classList.contains('slds-button_brand')) {
				this.unfocusBtn(i)
			}
		})

		let btn = this.template.querySelector('#' + e.currentTarget.id)
		this.focusBtn(btn)

		this.recurFreq = e.currentTarget.value;
	}

	clickDonationAmtBtn(e) {
		let otherAmt = this.template.querySelector('[data-id="otherAmt"]')
		otherAmt.value = null

		this.template.querySelectorAll('.amtBtns').forEach(i => {
			if (i.classList.contains('slds-button_brand')) {
				this.unfocusBtn(i)
			}
		})
		
		let btn = this.template.querySelector('[name="' + e.currentTarget.name + '"]')
		this.focusBtn(btn)

		this.donationAmt = e.currentTarget.value
	}

	changeOtherDonationAmt(e) {
		this.template.querySelectorAll('.amtBtns').forEach(i => {
			if (i.classList.contains('slds-button_brand')) {
				this.unfocusBtn(i)
			}
		})

		this.donationAmt = e.detail.value
	}

	checkFeeCheckbox(e) {
		this.addFee = e.currentTarget.checked
	}

	clickDonateBtn() {
		if (this.validate()) {

			let interval
			let count;
			if (this.showFreq) {
				switch (this.recurFreq) {
					case 'week':
						interval = 'week'
						count = 1
						break
					case 'biweek':
						interval = 'week'
						count = 2
						break
					case 'month':
						interval = 'month'
						count = 1
						break
					case 'quarter':
						interval = 'month'
						count = 3
						break
					case 'year':
						interval = 'year'
						count = 1
						break
					default:
						interval = 'once'
						count = 1
						break
				}	
			} else {
				interval = 'once'
				count = 1
			}

			this.givingInterval = {
				isRecurring: this.showFreq,
				interval: interval,
				intervalCount: count
			}

			console.log(this.givingInterval);

			console.log('send to payment processor');
			this.checkoutWithStripe()
		}
	}

	// # GETTERS/SETTERS

	get honorOptions() {
		return [
			{ label: 'Honor', value: 'honor' },
			{ label: 'Memorial', value: 'memorial' }
		]
	}

	get stateOptions() {
		return [
			{ label: 'Alabama', value: 'Alabama' },
			{ label: 'Alaska', value: 'Alaska' },
			{ label: 'Arizona', value: 'Arizona' },
			{ label: 'Arkansas', value: 'Arkansas' },
			{ label: 'California', value: 'California' },
			{ label: 'Colorado', value: 'Colorado' },
			{ label: 'Connecticut', value: 'Connecticut' },
			{ label: 'Delaware', value: 'Delaware' },
			{ label: 'Florida', value: 'Florida' },
			{ label: 'Georgia', value: 'Georgia' },
			{ label: 'Hawaii', value: 'Hawaii' },
			{ label: 'Idaho', value: 'Idaho' },
			{ label: 'Illinois', value: 'Illinois' },
			{ label: 'Indiana', value: 'Indiana' },
			{ label: 'Iowa', value: 'Iowa' },
			{ label: 'Kansas', value: 'Kansas' },
			{ label: 'Kentucky', value: 'Kentucky' },
			{ label: 'Louisiana', value: 'Louisiana' },
			{ label: 'Maine', value: 'Maine' },
			{ label: 'Maryland', value: 'Maryland' },
			{ label: 'Massachusetts', value: 'Massachusetts' },
			{ label: 'Michigan', value: 'Michigan' },
			{ label: 'Minnesota', value: 'Minnesota' },
			{ label: 'Mississippi', value: 'Mississippi' },
			{ label: 'Missouri', value: 'Missouri' },
			{ label: 'Montana', value: 'Montana' },
			{ label: 'Nebraska', value: 'Nebraska' },
			{ label: 'Nevada', value: 'Nevada' },
			{ label: 'New Hampshire', value: 'New Hampshire' },
			{ label: 'New Jersey', value: 'New Jersey' },
			{ label: 'New Mexico', value: 'New Mexico' },
			{ label: 'New York', value: 'New York' },
			{ label: 'North Carolina', value: 'North Carolina' },
			{ label: 'North Dakota', value: 'North Dakota' },
			{ label: 'Ohio', value: 'Ohio' },
			{ label: 'Oklahoma', value: 'Oklahoma' },
			{ label: 'Oregon', value: 'Oregon' },
			{ label: 'Pennsylvania', value: 'Pennsylvania' },
			{ label: 'Rhode Island', value: 'Rhode Island' },
			{ label: 'South Carolina', value: 'South Carolina' },
			{ label: 'South Dakota', value: 'South Dakota' },
			{ label: 'Tennessee', value: 'Tennessee' },
			{ label: 'Texas', value: 'Texas' },
			{ label: 'Utah', value: 'Utah' },
			{ label: 'Vermont', value: 'Vermont' },
			{ label: 'Virginia', value: 'Virginia' },
			{ label: 'Washington', value: 'Washington' },
			{ label: 'West Virginia', value: 'West Virginia' },
			{ label: 'Wisconsin', value: 'Wisconsin' },
			{ label: 'Wyoming', value: 'Wyoming' }
		]
	}

	get isHonor() {
		return this.honorSelection === 'honor'
	}

	get typeOnce() {
		console.log(this.givingType);
		return this.givingType === 'once'
	}

	get typeRecur() {
		return this.givingType === 'recur'
	}
	
	get fee() {
		return this.processingFee.Use_Flat_Fee__c 
			? ((Number(this.processingFee.Flat_Fee__c)).toFixed(2)).toString()
			: ((Number(this.donationAmt) * (Number(this.processingFee.Processing_Fee_Percentage__c) * 0.01)).toFixed(2)).toString()
	}

	get total() {
		return this.addFee 
			? (Number(this.donationAmt) + Number(this.fee)).toFixed(2).toString()
			: Number(this.donationAmt).toString() + '.00'
	}

	get noTotal() {
		return Number(this.total) !== 0;
	}

	get feeCheckboxLabel() {
		return 'I would like to cover the processing fee by adding $' + this.fee + ' to my donation.'
	}

	get selectedDonation() {
		return this.donationAmt !== 0
	}

	get customTextColor() {
		return 'color:' + this.headerTextColor + ';font-size:x-large;'
	}

	get customHeaderColor() {
		return 'background-color:' + this.headerColor + ';'
	}
}