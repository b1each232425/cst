import Toast from './Toast.svelte';
import { mount } from 'svelte';

let toastContainer;
function ensureContainer() {
	if (!toastContainer) {
		toastContainer = document.createElement('div');
		toastContainer.className = 'toast-container';
		document.body.appendChild(toastContainer);
	}
}
function showToast(message, type = 'success', duration = 3000) {
	ensureContainer();
	const container = document.createElement('div');
	toastContainer.appendChild(container);
	mount(Toast, {
		target: container,
		props: {
			message,
			type,
			duration
		}
	});
	setTimeout(() => {
		container.remove();
	}, duration + 500);
	if (toastContainer && toastContainer.childElementCount === 0) {
		toastContainer = null;
		toastContainer.remove();
	}
}

export const toast = {
	success: (msg, duration = 3000) => showToast(msg, 'success', duration),
	error: (msg, duration = 3000) => showToast(msg, 'error', duration),
	warning: (msg, duration = 3000) => showToast(msg, 'warning', duration)
};
