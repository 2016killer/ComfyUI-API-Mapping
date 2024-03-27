import { app } from "../../scripts/app.js";
import { $el } from "../../scripts/ui.js";
import { api } from "../../scripts/api.js";

export class SEFUtils {
	//static LOCALE_ID = "SEF.SaveExecute";
	//static LOCALE_ID_LAST = "SEF.SaveExecuteLast";
	static ELS = {};
	static addSettingsMenuOptions(app) {
		app.ui.settings.addSetting({
            id: "SEF.indent",
            name: "API映射-json缩进",
            type: "slider",
            attrs: {
                min: 0,
                max: 8,
                step: 1,
            },
            defaultValue: 0,
        });

		app.ui.settings.addSetting({
			id: "SEF.save_extra",
			name: "API映射-额外信息",
			type: "boolean",
			defaultValue: false,
		});
	}
}
function SearchDict(dict,path,value,offset) {//offset:偏移+初始调用信息
	function What(key) {
		if (offset != undefined)
		{
			path.splice(0, 0, key);
			for(let i = 0;i < path.length;i++)
			{
				if (path[i])//删除空字符
					continue;
				path.splice(i,1);
			}
			path.slice(0, path.length + offset)
			return path;
		}
		else
			return key;
	}
	if (!value) 
		return [];
	for (let key in dict) 
	{
		if (key == value)
			return What(key);
		if (typeof dict[key] === 'object') {
			let find_key = SearchDict(dict[key],path,value);
			if (find_key != null )
			{
				path.splice(0, 0, find_key);
				return What(key);
			}
		} 
		else if(dict[key] == value)
			return What(key);
	}
	return null;//空字典
}

const ext = {
	name: "APIMapping-DaMing",
	async SaveEF() {
		const p = await app.graphToPrompt();
		let workflow = p.workflow;
		const body = {
			// client_id: api.clientId,
			prompt: p.output,
			extra_data: {},
		};
		if (app.ui.settings.getSettingValue('SEF.save_extra',false))
			body.extra_data = { extra_pnginfo: { workflow } };

		let remapping_info = {};
		let remapping_nodes = [];
		//获取输出节点与重映射配置
		Object.entries(p.output).forEach(function([key, value]) {
			if (value.class_type=="DaMingAPIMapping")
			{
				remapping_nodes.push(key);
				let text = value.inputs.info.replace(/\[/g, '{').replace(/\]/g, '}');
				text = text.replace(/\(/g, '[').replace(/\)/g, ']');
				text = "{"+text+"}";
				try {
					remapping_info = JSON.parse(text);
				} catch (error) {
					console.log(text,':转换失败');
				}
			}		
		});

		//节点搜索与重映射处理
		let temp
		let remapping_data = {}
		for(let key_ in remapping_info)
		{	
			let filter = [];
			Object.entries(p.output).forEach(function([key, node]) {
				try {
					if (eval(remapping_info[key_].id_rule) && node.class_type!="DaMingAPIMapping")
						filter.push(key);
				} catch (error) {
					console.log(key,",id规则错误:",remapping_info[key_]);
				}
			});
			
			remapping_data[key_] = [];
			for(let i = 0; i<filter.length; i++)
			{
				for(let j = 0;j < remapping_info[key_].value.length;j++)
				{
					let offset = remapping_info[key_]?.offset;
					if (!offset)
						offset = 0;
					temp = SearchDict(p.output[filter[i]],[],remapping_info[key_].value[j],offset,true);		
					if (temp!=null)
					{
						try {
							temp.splice(0,0,filter[i]);
							temp.push(p.output[filter[i]].class_type);
							remapping_data[key_].push(temp);
						} 
						catch (e) {
							console.log("错误:",e,"\n数组:",temp)
						}
					}
				}
			}
		}

		console.log("重映射:",remapping_data);
		console.log("重映射节点:",remapping_nodes);

		body.remapping_data = remapping_data;
		body.remapping_nodes = remapping_nodes;

		let filename = "API.json";
		filename = prompt("API保存为:", filename);
		if (!filename) return;
		if (!filename.toLowerCase().endsWith(".json")) {
			filename += ".json";
		}
		let indent = parseInt(app.ui.settings.getSettingValue('SEF.indent',0))
		const json = JSON.stringify(body, null, indent); // convert the data to a JSON string
		const blob = new Blob([json], {type: "application/json;charset=utf-8"});
		const url = URL.createObjectURL(blob);
		const a = $el("a", {
			href: url,
			download: filename,
			style: {display: "none"},
			parent: document.body,
		});
		a.click();
		setTimeout(function () {
			a.remove();
			window.URL.revokeObjectURL(url);
		}, 0);

	},
	async init(app) {
		// Any initial setup to run as soon as the page loads
		SEFUtils.addSettingsMenuOptions(app)
		return;
	},
	async setup(app) {
		// 构造设置面板
		// this.settings = new AGLSettingsDialog();
		// 添加按钮
		app.ui.menuContainer.appendChild(
			$el("button.DM-SEF-btn", {
				id: "Save-ExecuteFlow",
				textContent: "保存API",
				onclick: () => this.SaveEF(),
			}));
	},
	async addCustomNodeDefs(defs, app) {
		// Add custom node definitions
		// These definitions will be configured and registered automatically
		// defs is a lookup core nodes, add yours into this
		// console.log("[logging]", "add custom node definitions", "current nodes:", Object.keys(defs));
	},
	async getCustomWidgets(app) {
		// Return custom widget types
		// See ComfyWidgets for widget examples
		// console.log("[logging]", "provide custom widgets");
	},
	async beforeRegisterNodeDef(nodeType, nodeData, app) {
		// Run custom logic before a node definition is registered with the graph
		// console.log("[logging]", "before register node: ", nodeType.comfyClass);
		// This fires for every node definition so only log once
		// applyNodeTranslationDef(nodeType, nodeData);
		// delete ext.beforeRegisterNodeDef;
	},
	async registerCustomNodes(app) {
		// Register any custom node implementations here allowing for more flexability than a custom node def
		// console.log("[logging]", "register custom nodes");
	},
	loadedGraphNode(node, app) {
		// Fires for each node when loading/dragging/etc a workflow json or png
		// If you break something in the backend and want to patch workflows in the frontend
		// This fires for every node on each load so only log once
		// delete ext.loadedGraphNode;
	},
	nodeCreated(node, app) {
		// Fires every time a node is constructed
		// You can modify widgets/add handlers/etc here
	}
};

app.registerExtension(ext);
