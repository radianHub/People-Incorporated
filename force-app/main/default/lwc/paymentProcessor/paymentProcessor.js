import { LightningElement, api, wire } from "lwc";
// import { CurrentPageReference } from 'lightning/navigation';

import getSettings from '@salesforce/apex/paymentProcessorController.getSettings';
import savePaymentIntent from '@salesforce/apex/paymentProcessorController.savePaymentIntent';

export default class PaymentProcessor extends LightningElement {
	@api recordId;
	@api total;
	@api givingType;
	@api honoree;
	settings;

	// closeModal() {
	// 	this.dispatchEvent(new CloseActionScreenEvent());
	// }

	// # LIFECYCLE HOOKS

	connectedCallback() {
		console.log('Connected');
		this.getSettings()
	}

	// # APEX

	getSettings() {
		getSettings()
		.then((r) => {this.settings = r})
		.catch((e) => console.log(e))
	}

	savePaymentIntent(d) {
		savePaymentIntent( {data: d} )
		.then(r => console.log(r))
		.catch(e => console.log(e))
	}

	// # PRIVATE METHODS

	@api checkoutWithStripe() {	
		let params = {
			'success_url': window.location.origin, // Will be set in a custom setting
			'cancel_url': window.location.origin, // Will be set in a custom setting
			'line_items[0][price_data][unit_amount]': Number(this.total) * 100,
			'line_items[0][quantity]': 1,
			'line_items[0][price_data][currency]': 'usd',
			'line_items[0][price_data][product_data][name]': 'Donation',
			'phone_number_collection[enabled]': true,
			'billing_address_collection': 'required',
			'mode': this.givingType === 'once' ? 'payment' : 'subscription',
			'payment_method_types[0]': 'card'
		}

		if (this.givingType === 'month') {
			params = {
				...params,
				'line_items[0][price_data][recurring][interval]': 'month'
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

			let data = {
				stripeId: repos.id,
				amount: repos.amount_total / 100,
				status: repos.status,
				paymentMethod: repos.payment_method_types,
				paymentStatus: repos.payment_status,
				type: repos.mode,
				expires: repos.expires_at,
				honor: this.honoree
			}

			console.log(data);
			this.savePaymentIntent(JSON.stringify(data))

			window.open(repos.url, '_blank')
		})
	}

	// # HANDLERS		

	// # GETTERS/SETTERS

}