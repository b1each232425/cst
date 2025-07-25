import MessageBox from './MessageBox.svelte';
import { mount, unmount } from 'svelte';

export default function ({
	title = '温馨提示',
	content = '',
	center = false,
	cancel_text = '取消',
	confirm_text = '确定',
	show_cancel_icon = true,
	show_cancel_button = true,
	show_confirm_button = true,
	cancel_button_type = 'info',
	confirm_button_type = 'primary',
	onConfirm = () => {},
	onCancel = () => {}
}) {
	const container = document.createElement('div');
	document.body.appendChild(container);

	let app = mount(MessageBox, {
		target: container,
		props: {
			visible: true,
			title,
			center,
			content,
			confirm_text,
			cancel_text,
			show_cancel_icon,
			cancel_button_type,
			show_cancel_button,
			show_confirm_button,
			confirm_button_type,
			onConfirm: async () => {
				await onConfirm();
				unmount(app, { outro: true });
				container.remove();
			},
			onCancel: async () => {
				await onCancel();
				unmount(app, { outro: true });
				container.remove();
			}
		}
	});
}
