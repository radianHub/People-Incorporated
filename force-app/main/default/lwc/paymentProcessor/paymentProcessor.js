import { LightningElement, api } from "lwc";
import { CloseActionScreenEvent } from 'lightning/actions';

export default class PaymentProcessor extends LightningElement {
	@api recordId;
	@api objectApiName;
	closeModal() {
		this.dispatchEvent(new CloseActionScreenEvent());
	}


	// # LIFECYCLE HOOKS

	// # APEX

	// # PRIVATE METHODS

	// # HANDLERS

	// # GETTERS/SETTERS
}