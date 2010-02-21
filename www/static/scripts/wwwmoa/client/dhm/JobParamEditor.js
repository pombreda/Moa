
dojo.provide("wwwmoa.client.dhm.JobParamEditor");

dojo.require("wwwmoa.client.store.Params");
dojo.require("wwwmoa.client.dhm._DHM");
dojo.require("wwwmoa.client.dhm.FSBrowser");

dojo.require("dojo.data.ItemFileReadStore");

dojo.require("dijit.Tooltip");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.DropDownButton");
dojo.require("dijit.TooltipDialog");
dojo.require("dijit.TitlePane");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit._Widget");
dojo.require("dojo.string");


dojo.addOnLoad(function() {dojo.declare("wwwmoa.client.dhm.JobParamEditor", wwwmoa.client.dhm._DHM, {

		_store : null,
		_changed : false,
		_saving : false,
	        _reverting : false,
	        _location : "",
	        _editorDOM : null,
	        _editorButtons : [],
	        _visualLocked : false,

		_pathDropDown : null,
		_pathFSBrowser : null,
		_pathInputWidget : null,
		_pathBreadcrumb : null,

		/* Attribute Handlers */
		_setLocationAttr : function(val) {
		    this._location=val;
		    this._navToLocation();
		},

		_getLocationAttr : function() {
		    return this._location;
		},

		// Loads the parameters for the current location.
	        _navToLocation : function() {
		    this._dhmSetVisualByCode("Loading parameters...");

		    this.dhmLock();

		    this._cancelSyncStore();
		    this._syncStore(dojo.hitch(this, this._navToLocationCallback));
		},

		// Receives the data requested by _navToLocation.
	        _navToLocationCallback : function(success) {
		    if(!success) {
			this._dhmSetVisualByCode("No parameters were found.");
			this.dhmUnlock();
			return;
		    }

		    this._pushStore();

		    this.dhmUnlock();
		},

		// Updates the _store object with values from the display.
	        _pullStore : function() {
		    var params=[], param_values=[];

		    params=this._store.getParamNames();

		    for(var x=0; x<params.length; x++) {
			param_values=this._getEditorParamValues(params[x]);

			this._store.rewriteParam(params[x], param_values);
		    }

		    return true;
		},

	        _getEditorParamValues : function(paramname) {
		    var trs=[], curtds=[], curspans=[];
		    var curtr_name="";
		    var curtr_valuewidgets=[], curtr_values=[];

		    if(this._editorDOM==null)
			return [];

		    trs=dojo.query("tr", this._editorDOM);

		    for(var x=0; x<trs.length; x++) {
			curtds=dojo.query("td", trs[x]);

			curtr_name=dojo.query("input", curtds[0])[0].value;

			if(curtr_name==paramname) {
			    curspans=dojo.query("span", curtds[2]);

			    for(var y=0; y<curspans.length; y++)
				curtr_valuewidgets=curtr_valuewidgets.concat(dijit.findWidgets(curspans[y]));

			    for(var y=0; y<curtr_valuewidgets.length; y++)
				curtr_values[y]=curtr_valuewidgets[y].attr("value");

			    break;
			}
		    }

		    return curtr_values;
		},

		// Updates the display with values from the _store object.
	        _pushStore : function() {
		    var groups=[], params=[], values=[];

		    var group_advanced=false;
		    var group_widget_container;
		    var group_dom_table, group_dom_tbody, group_dom_center, group_dom_padding;

		    var param_name="", param_store, param_widgets=[];
		    var param_dom_row, param_dom_title, param_dom_button, param_dom_values;
		    var param_dom_remove=[], param_dom_cells=[];

		    var value_dom_marker;


		    var editor_dom, editor_dom_center, editor_dom_rows=[];
		    var editor_buttons=[];


		    var savebutton_params={
			label : "No Changes Made Yet",
			onClick : dojo.hitch(this, function() { this._save(); }),
			disabled : true
		    };

		    var revbutton_params={
			label : "No Changes Made Yet",
			onClick : dojo.hitch(this, function() { this._revert(); }),
			disabled : true
		    };

		    var createButton = function(params) {
			var new_button=new dijit.form.Button(params);
			editor_dom.appendChild(new_button.domNode);
			editor_buttons.push(new_button);
		    };



		    this.dhmLock();


		    if(this._editorDOM==null) {
			editor_dom=dojo.create("div", null);

			createButton(savebutton_params);
			createButton(revbutton_params);

			editor_dom_center=dojo.create("div", null);
			editor_dom.appendChild(editor_dom_center);

			createButton(savebutton_params);
			createButton(revbutton_params);

			this._editorButtons=editor_buttons;

			editor_dom.appendChild(dojo.create("div", {innerHTML : "<span style=\"color:#FF0000; font-weight:bold\">*</span> denotes required parameter"}));

			groups=this._store.getParamGroups();

			for(var x=0; x<groups.length; x++) {
			    group_advanced=(groups[x]=="advanced");

			    group_dom_padding=dojo.create("div", {style : { margin : "20px 0px 20px 0px" }});
			    group_dom_padding.appendChild(dojo.create("input", {type : "hidden", value : groups[x]}));

			    group_widget_container=new dijit.TitlePane({
				    title : (groups[x]=="" ? "General" : wwwmoa.util.str.title_case(groups[x]))+" Parameters",
				    open : !group_advanced
				});

			    group_dom_padding.appendChild(group_widget_container.domNode);

			    editor_dom_center.appendChild(group_dom_padding);

			    group_dom_center=group_widget_container.containerNode;

			    if(group_advanced)
				group_dom_center.appendChild(dojo.create("div", {
					    style : {color:"#FF0000", fontWeight : "bold"},
					    innerHTML : "Warning: It is strongly suggested that you not tamper with these parameters unless you are an advanced user!"
						}));



			    group_dom_table=dojo.create("table", {width : "100%"});
			    group_dom_center.appendChild(group_dom_table);
			    group_dom_tbody=dojo.create("tbody", null); // Note: a tbody node is required for MSIE
			    group_dom_table.appendChild(group_dom_tbody);


			    params=this._store.getParamsByGroup(groups[x]);


			    for(var y=0; y<params.length; y++) {
				param_dom_row=dojo.create("tr", null);

				// title cell
				param_dom_title=dojo.create("td", {
					style : {fontWeight : "bold", verticalAlign : "top", width : "20%"},
					innerHTML : wwwmoa.formats.html.fix_text(params[y].name)
				    });

				if(params[y].required)
				    param_dom_title.appendChild(dojo.create("span", {
						style : {color : "#FF0000"},
						innerHTML : "*"
						    }));

				param_dom_title.appendChild(dojo.create("input", {type : "hidden", value : params[y].name}));


				param_dom_row.appendChild(param_dom_title);


				// button cell
				param_dom_button=dojo.create("td", {
					style : {paddingLeft : "20px", verticalAlign : "top", width : "20%"}
				    });

				param_dom_button.appendChild(this._createHelpNode(params[y]));

				param_dom_button.appendChild((new dijit.form.Button({ 
						showLabel : false,
						iconClass : 'moaAddButton',
						disabled : (params[y].cardinality!=this._store.CARD_MANY),
						onClick : dojo.hitch({main : this, name : params[y].name},
								     function() {
									 this.main._addValue(this.name);
								     }
								     )})).domNode);

				param_dom_row.appendChild(param_dom_button);


				// values cell
				param_dom_values=dojo.create("td", {
					style : {paddingLeft : "20px", verticalAlign : "top", width : "60%"}
				    });

				param_dom_row.appendChild(param_dom_values);


				group_dom_tbody.appendChild(param_dom_row);
			    }

			}

			this._editorDOM=editor_dom;

			this._switchVisualToEditor();
		    }
		    else
			editor_dom=this._editorDOM;



		    editor_dom_rows=dojo.query("tr", editor_dom);

		    for(var x=0; x<editor_dom_rows.length; x++) {
			param_dom_cells=dojo.query("td", editor_dom_rows[x]);
			param_name=dojo.query("input", param_dom_cells[0])[0].value;
			param_store=this._store.getParam(param_name);

			values=param_store.values;

			// Note: this should always go first, since widgets may contain a br node
			param_widgets=dijit.findWidgets(param_dom_cells[2]);

			for(var y=0; y<param_widgets.length; y++)
			    param_widgets[y].destroyRecursive();


			param_dom_remove=dojo.query("br", param_dom_cells[2]);

			for(var y=0; y<param_dom_remove.length; y++)
			    param_dom_cells[2].removeChild(param_dom_remove[y]);


			for(var y=0; y<values.length; y++) {
			    if(y!=0)
				param_dom_cells[2].appendChild(dojo.create("br", null));

			    value_dom_marker=dojo.create("span", null);

			    param_dom_cells[2].appendChild(value_dom_marker);

			    value_dom_marker.appendChild(
			            this._createParameterWidget(
				            this._store.transValueITO(values[y], param_store.type),
					    param_store.type,
					    param_store.options
					    ).domNode);

			    param_dom_cells[2].appendChild((new dijit.form.Button(
                  {
                    showLabel : false,
                    iconClass : 'moaResetButton',
                    onClick : dojo.hitch({main : this, name : param_name, index : y},
				      function() {
					    this.main._useDefaultValue(this.name, this.index);
					  }
						)})).domNode);

			    param_dom_cells[2].appendChild(dojo.create("br", null));

			    if(values.length>1)
				param_dom_cells[2].appendChild((new dijit.form.Button({
						label : "Remove Value",
					        style : {fontSize : "10px", fontWeight : "bold"},
                                                onClick : dojo.hitch({main : this, name : param_name, index : y},
								     function() {
									 this.main._removeValue(this.name, this.index);
								     }
								     )})).domNode);


			}
		    }

		    this.dhmUnlock();

		    return true;
		},

		// Sends the contents of the _store object to the server
		// for storage.
		_sendStore : function(callback) {

		    var request={};
		    var params=this._store.getParams();

		    for(var p in params) {
			if(params[p]["type"]!=this._store.TYPE_UNKNOWN)
			    request[this._store.transNameITO(params[p]["name"])]=this._store.transValuesITO(params[p]["values"]);
		    }


		    var request_json=wwwmoa.formats.json.encode(request);

		    wwwmoa.io.ajax.put(wwwmoa.io.rl.get_api("moa-jobparams", this.attr("location")), dojo.hitch(this,function(data) {
				var store;
				var response=wwwmoa.formats.json.parse(data); // attempt a parse of the received data

				if(data==null) { // if null was passed, we have an error
				    try{ callback(false); } catch(e) {}
				    return;
				}

				if(!response.success) { // if success is equal to false, we have an error
				    try{ callback(false); } catch(e) {}
				    return;
				}

				try {callback(true);} catch(e) {}

			    }) , 8192, request_json); // be somewhat patient about sending the store
		},

		// Updates the _store object with values from the server.
	        _syncStore : function(callback) {
		    this._syncCallback=callback;

		    this._syncRequest=wwwmoa.io.ajax.get(wwwmoa.io.rl.get_api("moa-jobparams", this.attr("location")),
							 dojo.hitch(this,function(data) {
				var store;
				var response=wwwmoa.formats.json.parse(data); // attempt a parse of the received data

				this._syncRequest=null; // this request is being handled, so remove it

				if(data==null) { // if null was passed, we have an error
				    try{ callback(false); } catch(e) {}
				    return;
				}

				// create params store
				store=new wwwmoa.client.store.Params();

				// decode params
				store.setParams(store.transParamsOTI(response["parameters"]));

				// make store "public"
				this._store=store;

				// force reload of editor DOM
				this._editorDOM=null;

				try {callback(true);} catch(e) {}

			    }) , 16000); // be somewhat patient about receiving the parameters
		},

		// Cancels the request sent by _syncStore.
		_cancelSyncStore : function() {
		    if(this._syncRequest==null)
			return;

		    this._syncRequest.cancel();

		    this._syncRequest=null;

		    this._syncCallback(false); // we consider a cancel as an error
		},

		/* Display Utilities */
		_switchVisualToEditor : function() {
		    if(this._editorDOM!=null) {
			this._visualLockingAction();
			this._dhmSetVisualByNode(this._editorDOM); // make main code "public"
		    }
		},

	        _getSaveButtons : function() {
		    var buttons=this._getButtons();

		    if(buttons.length!=4)
			return [];

		    return [buttons[0], buttons[2]];
		},

	        _getRevButtons : function() {
		    var buttons=this._getButtons();

		    if(buttons.length!=4)
			return [];

		    return [buttons[1], buttons[3]];
		},

	        _getButtons : function() {
		    if(this._editorDOM==null)
			return [];
		    else
			return this._editorButtons;
		},

	        _setSaveButtonState : function(text, disabled) {
		    this._setButtonState(this._getSaveButtons(), text, disabled);
		},

	        _setRevButtonState : function(text, disabled) {
		    this._setButtonState(this._getRevButtons(), text, disabled);
		},

	        _setButtonState : function(widgetlist, text, disabled) {
		    for(var x=0; x<widgetlist.length; x++) {
			widgetlist[x].attr("disabled", disabled);
			widgetlist[x].attr("label", wwwmoa.formats.html.fix_text(text));
		    };
		},

		/* State Utilities */
	        _registerChange : function() {
		    this._changed=true;

		    this._setSaveButtonState("Save Parameters", false);
		    this._setRevButtonState("Undo Changes", false);
		},

	        _registerSaveStart : function() {
		    this._saving=true;

		    this._setSaveButtonState("Saving Parameters...", true);
		    this._setRevButtonState("Cannot Undo While Saving", true);
		},

		_registerSaveFailure : function() {
		    this._saving=false;

		    this._setSaveButtonState("Retry Save", false);
		    this._setRevButtonState("Undo Changes", false);
		},

	        _registerSaveSuccess : function() {
		    this._changed=false;
		    this._saving=false;

		    this._setSaveButtonState("Saved", true);
		    this._setRevButtonState("No Changes Made Since Save", true);
		},

	        _isSaving : function() {
		    return this._saving;
		},

	        _registerRevertStart : function() {
		    this._reverting=true;

		    this._setSaveButtonState("Cannot Save While Reverting", true);
		    this._setRevButtonState("Reverting...", true);
		},

	        _registerRevertSuccess : function() {
		    this._changed=false;
		    this._reverting=false;
		},

	        _isReverting : function() {
		    return this._reverting;
		},

		// Starts a high-level save operation.
	        _save : function() {
		    if(!this._isUnsaved())
			return;

		    if(this._isSaving() || this._isReverting())
			return;

		    this._registerSaveStart();

		    this.dhmLock();

		    this._dhmDisableSetVisualCleaning();

		    this._dhmSetVisualByCode("Saving parameters...");

		    if(!this._pullStore()) {
			this._registerSaveFailure();
			this.dhmUnlock();
			return;
		    }

		    this._sendStore(dojo.hitch(this, this._saveCallback));
		},

		// Finishes a high-level save operation.
	        _saveCallback : function(success) {
		    this.dhmUnlock();

		    this._dhmEnableSetVisualCleaning();

		    this._switchVisualToEditor();

		    if(!success)
			this._registerSaveFailure();
		    else
			this._registerSaveSuccess();
		},

		// Starts a high-level revert operation.
	        _revert : function() {
		    if(!this._isUnsaved())
			return;

		    if(this._isSaving() || this._isReverting())
			return;

		    this._registerRevertStart();

		    this.dhmLock();

		    this._dhmSetVisualByCode("Undoing changes to parameters...");

		    setTimeout(dojo.hitch(this, function() {
				this._navToLocation();
				this.dhmUnlock();
				this._registerRevertSuccess();
			    }), 1000); // delay so that user can see something happened

		},

		// Completes a high-level add operation.
		// To be used on a multivalued parameter.
	        _addValue : function(paramname) {
		    var param_default;

		    param_default=this._store.getParam(paramname)["default"];

		    this.dhmLock();

		    this._pullStore();

		    this._store.rewriteParam(paramname, this._getEditorParamValues(paramname).concat(param_default));

		    this._pushStore();

		    this.dhmUnlock();

		    this._registerChange();
		},

		// Completes a high-level remove operation.
		// To be used on a multivalued parameter.
		_removeValue : function(paramname, valueindex) {
		    var param_values;

		    this.dhmLock();

		    this._pullStore();

		    param_values=this._getEditorParamValues(paramname);
		    param_values.splice(valueindex, 1);

		    this._store.rewriteParam(paramname, param_values);

		    this._pushStore();

		    this.dhmUnlock();

		    this._registerChange();
		},

		 // Completes a high-level use default operation.
		_useDefaultValue : function(paramname, valueindex) {
		    var param_values;
		    var default_value;

		    this.dhmLock();

		    this._pullStore();

		    try {
			default_value=this._store.getParam(paramname)["default"];
		    }
		    catch(e) {
			return;
		    }

		    param_values=this._getEditorParamValues(paramname);

		    if(valueindex>=0 && valueindex<param_values.length)
			param_values[valueindex]=default_value;

		    this._store.rewriteParam(paramname, param_values);

		    this._pushStore();

		    this.dhmUnlock();

		    this._registerChange();
		},

	        _isUnsaved : function() {
		    return this._changed;
		},

		/* DHM Handlers */
	        _visualLockingAction : function() {
		    if(this._editorDOM!=null)
			this._editorDOM["style"]["visibility"]=(this._visualLocked ? "hidden" : "visible");
		},

	        _dhmUnlockVisual : function() {
		    this._visualLocked=false;
		    this._visualLockingAction();
		},

	        _dhmLockVisual : function() {
		    this._visualLocked=true;
		    this._visualLockingAction();
		},

		// Creates a node to use as a help button.
	        _createHelpNode : function(param) {
		    var help_string="", help_typestring="", help_titlestring="";
		    var help_button, help_dialog;

		    help_string+=dojo.string.trim(param.help);

		    if(help_string=="")
			help_string="No detailed help is available for this parameter.";

		    if(param.type==this._store.TYPE_PATH)
			help_typestring="(type: path)";
		    else if(param.type!=this._store.TYPE_UNKNOWN)
		        help_typestring="(type: "+this._store.transTypeITO(param.type)+")";

		    help_titlestring=wwwmoa.formats.html.fix_text(param.name)+" Parameter";

		    help_string=wwwmoa.formats.html.fix_text(help_string);
		    help_typestring=wwwmoa.formats.html.fix_text(help_typestring);

		    help_dialog=new dijit.TooltipDialog( 
		    		{content : "<div style=\"font-size:10pt\"><span style=\"font-weight:bold;text-decoration:underline; color:#108010\">"+help_titlestring+"</span><br><br>"+help_string+"<br><br>"+help_typestring+"</div>"});

		    help_button=new dijit.form.DropDownButton({
			    dropDown : help_dialog,
                showLabel: false,
                iconClass : 'moaHelpButton'
			});

		    return help_button.domNode;
		},

		// Creates a type-specific widget to accept input.
		_createParameterWidget : function(val, type, options) {
		    var cur_widget, cur_textwidget, cur_buttonwidget;
		    var items;
		    var style_obj= {border : "1px solid #FFFFFF", width : "85%"};

		    if(type==this._store.TYPE_STRING) {
			cur_widget=new dijit.form.TextBox({value : val, style : style_obj});
		    }
		    else if(type==this._store.TYPE_SET) {
			items=[];

			if(options!=null)
			    for(var x=0; x<options.length; x++)
				items.push({value : options[x],
					    label : wwwmoa.formats.html.fix_text(options[x])
					    });

			items={items : items, label : "label", identifier : "value"};
			items=new dojo.data.ItemFileReadStore({data : items});

			cur_widget=new dijit.form.FilteringSelect({value : val,
								   style : style_obj,
								   store : items,
								   searchAttr : "value"
			    });

		    }
		    else if(type==this._store.TYPE_INTEGER) {
			cur_widget=new dijit.form.NumberTextBox({
				constraints: {places : 0},
				invalidMessage : "This parameter must be an integer.",
				value : val,
				style : style_obj
			    });
		    }
		    else if(type==this._store.TYPE_FLOAT) {
			cur_widget=new dijit.form.NumberTextBox({
				invalidMessage : "This parameter must be a float.",
				value : val,
				style : style_obj
			    });
		    }
		    else if(type==this._store.TYPE_PATH) {
			this._initPathDropDown();

			cur_widget=new dijit._Widget({});

			cur_widget.domNode=dojo.create("div", {widgetid : cur_widget.id,
							       style : {display : "inline",
									padding : "8px",
									width : "65%"
				}});

			cur_textwidget=new dijit.form.TextBox({value : val});

			var event_obj={obj : this, inputwidget : cur_textwidget};

			cur_buttonwidget=new dijit.form.DropDownButton({label : "Select",
								       dropDown : this._pathDropDown
			    });

			cur_widget=dojo.mixin(cur_widget, {
				_getValueAttr : function() {
				    return cur_textwidget.attr("value");
				},

				_setValueAttr : function(val) {
				    cur_textwidget.attr("value", val);
				},

				destroyRecursive : function() {
				    cur_textwidget.destroyRecursive();
				    cur_buttonwidget.attr("dropDown", null); // remove dropdown to avoid
				                                             // it being destroyed
				    cur_buttonwidget.destroyRecursive();

				    dojo.destroy(this.domNode);
				}
			    });

			dojo.connect(cur_buttonwidget, "onFocus", event_obj, function() {
				this.obj._notifyPathDropDown();
				this.obj._pathInputWidget=this.inputwidget;
			    });


			dojo.connect(cur_buttonwidget, "onKeyPress", event_obj, function() {
				this.obj._registerChange();
			    });


			cur_widget.domNode.appendChild(cur_textwidget.domNode);
			cur_widget.domNode.appendChild(cur_buttonwidget.domNode);
		    }
		    else {
			cur_widget=new dijit.form.TextBox({
				value : "(format unknown)",
				style : style_obj,
				disabled : "disabled"
			    });
		    }

		    dojo.connect(cur_widget, "onKeyPress", this, function() {
			    this._registerChange();
			});

		    dojo.connect(cur_widget, "onChange", this, function() {
			    this._registerChange();
			});

		    dojo.connect(cur_widget, "onFocus", cur_widget, function() {
			    var style_obj={ border : "1px solid #303060" };
			    this.attr("style", style_obj);
			});

		    dojo.connect(cur_widget, "onBlur", cur_widget, function() {
			    var style_obj={ border : "1px solid #FFFFFF" };
			    this.attr("style", style_obj);
			});

		    return cur_widget;
		},

		// Creates a drop down to use for selecting a file or directory,
		// if it has not already been created.
		_initPathDropDown : function() {
		    if(this._pathDropDown!=null)
			return;

		    this._pathDropDown=new dijit.TooltipDialog({});

		    var contNode=this._pathDropDown.containerNode;

		    this._pathFSBrowser=new wwwmoa.client.dhm.FSBrowser({cols : 3});

		    this._pathFSBrowser.dhmPoint(this);

		    this._pathFSBrowser.domNode.style.width="450px";
		    this._pathFSBrowser.domNode.style.height="350px";

		    var nav=dojo.create("div", {style : {borderBottom : "1px solid #B0B0B0",
							 padding : "2px",
							 marginBottom : "4px"
			    }});

		    this._pathBreadcrumb=dojo.create("span", {style : {paddingRight : "12px"}});

		    var pathselect=dojo.create("span", {innerHTML : "(Select)",
							onclick : dojo.hitch(this, function() {
							    var path=this._getRelPath(this.attr("location"),
										      this._pathFSBrowser.attr("location"));

							    this._pathInputWidget.attr("value", path);
							    this._registerChange();

							    dijit.popup.close(this._pathDropDown);
							}),
							style : {color : "#0000FF",
								 fontWeight : "bold",
								 cursor : "pointer"
			    }});


		    contNode.appendChild(nav);
		    nav.appendChild(this._pathBreadcrumb);
		    nav.appendChild(pathselect);
		    contNode.appendChild(this._pathFSBrowser.domNode);
		},

		// Instructs the drop down created using the previous function
		// to load contents from a given path.
		_notifyPathDropDown : function(path) {
		    if(this._pathFSBrowser==null)
			return;

		    this._pathFSBrowser.dhmNotify({type : wwwmoa.dhm.DHM_MSG_WDNAV,
				                   args : {path : (path==null ? this.attr("location") : path)}
			});
		},

		// Finds a relative path.
		_getRelPath : function(from, to) {
		    var rel="";
		    var from_arr, to_arr;
		    var x, y, to_start;
		    var pathsep="/";

		    var trimArr=function(arr) {
			while(arr[0]=="" && arr.length>0)
			    arr.shift();

			while(arr[arr.length-1]=="" && arr.length>0)
			    arr.pop();
		    };

		    var addPathComp=function(comp) {
			rel+=(rel!="" ? pathsep : "");
			rel+=comp;
		    };

		    from_arr=from.split(pathsep);
		    to_arr=to.split(pathsep);

		    trimArr(from_arr);
		    trimArr(to_arr);

		    to_start=from_arr.length;

		    for(x=0; x<from_arr.length; x++)
			if(from_arr[x]!=to_arr[x]) {
			    for(y=x; y<from_arr.length; y++)
				addPathComp("..");

			    to_start=x;

			    break;
			}

		    for(x=to_start; x<to_arr.length; x++)
			addPathComp(to_arr[x]);

		    rel=(rel=="" ? "." : rel);

		    return rel;
		},

		/* DHM Handlers */
		dhmNotify : function(message) {
		    if(message.type==wwwmoa.dhm.DHM_MSG_WDNAV)
			this.attr("location", message.args.path);

		    if(message.type==wwwmoa.dhm.DHM_MSG_DATA)
			if(message.args.key=="locationBreadcrumbNode")
			    if(this._pathBreadcrumb!=null) {
				dojo.empty(this._pathBreadcrumb);
				this._pathBreadcrumb.appendChild(message.args.data);
			    }
		},

		dhmPoll : function(poll) {
		    if(poll.type==wwwmoa.dhm.DHM_PLL_SHUTDOWN)
			return true;
		    else if(poll.type==wwwmoa.dhm.DHM_PLL_WDNAV)
			return !(this._isSaving() || this._isReverting());
		},

		dhmRequest : function(request, dhm) {
		    if(request.type==wwwmoa.dhm.DHM_REQ_FILEACTION) {
			this._pathInputWidget.attr("value",
						   this._getRelPath(this.attr("location"),
								    request.args.path));
			this._registerChange();

			dijit.popup.close(this._pathDropDown);
		    }
		    else if(request.type==wwwmoa.dhm.DHM_REQ_WDNAV)
			this._notifyPathDropDown(request.args.path);
		}

	    })});
