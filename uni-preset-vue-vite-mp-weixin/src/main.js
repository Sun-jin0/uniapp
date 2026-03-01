import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import api from "./api";
import './utils/latex.js';

export function createApp() {
	const app = createSSRApp(App);
	
	app.config.globalProperties.$api = api;
	
	return {
		app,
	};
}
