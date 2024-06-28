var UVAScriptGen = function(div) {
	this.values = {};
	this.containerDiv = div;
	this.inputs = {};
	this.inputs.features = {};
	this.formrows = [];
	this.settings = {
		script_formats : [ ["slurm", "Slurm"]],
		defaults : {
			email_address : "netid@virginia.edu",
		},
		ntasks : 1, 
		features : {},
		features_status : {},
		gres: {},
		gres_status: {}, 
		partitions : {},
		partitions_status : {},
		constraint : {}, 
		constraint_status: {}
	};
	return this;
};

UVAScriptGen.prototype.newCheckbox = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "checkbox";
	var formrows = this.formrows;
	if(args.checked)
		newEl.checked = true;
	if(args.toggle) {
		newEl.onclick = newEl.onchange = function () {
			if(formrows[args.toggle]) {
				formrows[args.toggle].style.display = newEl.checked ? "" : "none";
			}
			tthis.updateJobscript();
		};
	}
	else {
		newEl.onclick = newEl.onchange = function () {
				tthis.updateJobscript();
		};
	}
	return newEl;
}

UVAScriptGen.prototype.newRadio = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "radio";
	if(args.name)
		newEl.name = args.name;
	if(args.checked)
		newEl.checked = true;
	if(args.value)
		newEl.value = args.value;
	
	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

UVAScriptGen.prototype.newInput = function(args) {
	var tthis = this;
	var newEl = document.createElement("input");
	newEl.type = "text";
	if(args.size)
		newEl.size = args.size;
	if(args.maxLength)
		newEl.maxLength = args.maxLength;
	if(args.value)
		newEl.value = args.value;
	if(args.type)
		newEl.type = args.type

	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

UVAScriptGen.prototype.newSelect = function(args) {
	var tthis = this;
	var newEl = document.createElement("select");
	if(args.options) {
		for(var i in args.options) {
			var newOpt = document.createElement("option");
			newOpt.value = args.options[i][0];
			newOpt.text = args.options[i][1];
			if(args.selected && args.selected == args.options[i][0])
				newOpt.selected = true;
			newEl.appendChild(newOpt);
		}
	}
	newEl.onclick = newEl.onchange = function () {
		tthis.updateJobscript();
	};
	return newEl;
}

UVAScriptGen.prototype.newSpan = function() {
	var newEl = document.createElement("span");
	if(arguments[0])
		newEl.id = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		if(typeof arguments[i] == "string") {
			newEl.appendChild(document.createTextNode(arguments[i]));
		} else
			newEl.appendChild(arguments[i]);
	}
	return newEl;
};

UVAScriptGen.prototype.newA = function(url, body) {
	var a = document.createElement("a");
	a.href = url;
	a.appendChild(document.createTextNode(body));
	a.target = "_base";
	return a;
}

UVAScriptGen.prototype.createForm = function(doc) {
	form = document.createElement("form");

	// Job name
	this.inputs.job_name = this.newInput({});
	form.appendChild(this.createLabelInputPair("Job name: ", this.inputs.job_name));

	//Number of tasks
	this.inputs.num_tasks = this.newInput({type: "number"});
	form.appendChild(this.createLabelInputPair("Number of tasks: ", this.inputs.num_tasks))

	// Number of processor cores across all nodes
	this.inputs.num_cores = this.newInput({type: "number", value: 1});
	form.appendChild(this.createLabelInputPair("Number of processor cores across all nodes: ", this.inputs.num_cores));

	// Number of GPUs
	this.inputs.num_gpus = this.newInput({type: "number", value: 0, size: 4});
	form.appendChild(this.createLabelInputPair("Number of GPUs: ", this.inputs.num_gpus));

	// Memory per processor core
	this.inputs.mem_per_core = this.newInput({type: "number", value: 1, size: 6});
	this.inputs.mem_units = this.newSelect({options: [["GB", "GB"], ["MB", "MB"]]});
	form.appendChild(this.createLabelInputPair("Total Memory: ", this.newSpan(null, this.inputs.mem_per_core, this.inputs.mem_units)));

	// Partitions section
	this.inputs.partitions = [];
	var partitions_span = this.newSpan("uva_sg_input_partitions");
	var radioGroupName = "partitionOptions";
	for (var i in this.settings.partitions.names) {
		var new_radio = this.newRadio({
			name: radioGroupName,
			checked: i == 0 ? true : false,
			value: this.settings.partitions.names[i]
		});
		new_radio.partition_name = this.settings.partitions.names[i];
		this.inputs.partitions.push(new_radio);
		var url = this.newA(this.settings.partitions.info_base_url + this.settings.partitions.names[i], "?");
		var partition_container = this.newSpan(null);
		partition_container.className = "uva_sg_input_partition_container";
		var name_span = this.newSpan(null, this.settings.partitions.names[i], url);
		name_span.className = "uva_sg_input_partition_name";
		partition_container.appendChild(new_radio);
		partition_container.appendChild(name_span);
		partitions_span.appendChild(partition_container);

		new_radio.addEventListener('change', function() {
			updateVisibility();
		});
	}
	form.appendChild(this.createLabelInputPair("Partitions: ", partitions_span));

	// GRES
	this.inputs.gres = [];
	var gres_span = this.newSpan("uva_sg_input_gres");
	var gres_label = this.createLabelInputPair("GRES: ", gres_span);
	gres_label.style.display = "none";
	var gresRadioGroupName = "gresOptions";
	for (var i in this.settings.gres.names){
		var new_radio = this.newRadio({
			name: gresRadioGroupName,
			checked: false,
			value: this.settings.gres.names[i]
		});
		new_radio.gres_name = this.settings.gres.names[i];
		this.inputs.gres.push(new_radio);
		var url = this.newA(this.settings.gres.info_base_url + this.settings.gres.names[i], "?");
		var gres_container = this.newSpan(null);
		gres_container.className = "uva_sg_input_gres_container";
		var name_span = this.newSpan(null, this.settings.gres.names[i], url);
		name_span.className = "uva_sg_input_gres_name";
		gres_container.appendChild(new_radio);
		gres_container.appendChild(name_span);
		gres_span.appendChild(gres_container);

		new_radio.addEventListener('change', function() {
			updateVisibility();
		});
	}
	form.appendChild(gres_label);

	// Constraint
	this.inputs.constraint = [];
	var constraint_span = this.newSpan("uva_sg_input_constraint");
	var constraint_label = this.createLabelInputPair("Constraint: ", constraint_span);
	constraint_label.style.display = "none";
	var constraintRadioGroupName = "constraintOptions";
	for (var i in this.settings.constraints.names){
		var new_radio = this.newRadio({
			name: constraintRadioGroupName,
			checked: false,
			value: this.settings.constraints.names[i]
		});
		new_radio.constraint_name = this.settings.constraints.names[i];
		this.inputs.constraint.push(new_radio);
		var url = this.newA(this.settings.constraints.info_base_url + this.settings.constraints.names[i], "?");
		var constraint_container = this.newSpan(null);
		constraint_container.className = "uva_sg_input_constraint_container";
		var name_span = this.newSpan(null, this.settings.constraints.names[i], url);
		name_span.className = "uva_sg_input_constraint_name";
		constraint_container.appendChild(new_radio);
		constraint_container.appendChild(name_span);
		constraint_span.appendChild(constraint_container);
	}
	form.appendChild(constraint_label);


	this.inputs.single_node = this.newCheckbox({checked: 1});
	this.inputs.wallhours = this.newInput({value: "1", size: 3});
	this.inputs.wallmins = this.newInput({value: "00", size: 2, maxLength: 2});
	this.inputs.wallsecs = this.newInput({value: "00", size: 2, maxLength: 2});
	this.inputs.is_requeueable = this.newCheckbox({checked: 1});
	this.inputs.in_group = this.newCheckbox({checked: 0, toggle: "group_name"});
	this.inputs.group_name = this.newInput({value: ""});
	this.inputs.need_licenses = this.newCheckbox({checked: 0, toggle: "licenses"});
	this.inputs.lic0_name = this.newInput({});
	this.inputs.lic0_count = this.newInput({size: 3, maxLength: 4});
	this.inputs.lic1_name = this.newInput({});
	this.inputs.lic1_count = this.newInput({size: 3, maxLength: 4});
	this.inputs.lic2_name = this.newInput({});
	this.inputs.lic2_count = this.newInput({size: 3, maxLength: 4});
	this.inputs.email_begin = this.newCheckbox({checked: 0});
	this.inputs.email_end = this.newCheckbox({checked: 0});
	this.inputs.email_abort = this.newCheckbox({checked: 0});
	this.inputs.email_address = this.newInput({value: this.settings.defaults.email_address});

	form.appendChild(this.createLabelInputPair("Limit this job to one node: ", this.inputs.single_node));
	form.appendChild(this.createLabelInputPair("Walltime: ", this.newSpan(null, this.inputs.wallhours, " hours ", this.inputs.wallmins, " mins ", this.inputs.wallsecs, " secs")));
	form.appendChild(this.createLabelInputPair("Job is requeueable: ", this.inputs.is_requeueable));
	form.appendChild(this.createLabelInputPair("Allocation name (case sensitive): ", this.inputs.group_name));
	form.appendChild(this.createLabelInputPair("Receive email for job events: ", this.newSpan(null, this.inputs.email_begin, " begin ", this.inputs.email_end, " end ", this.inputs.email_abort, " abort")));
	form.appendChild(this.createLabelInputPair("Email address: ", this.inputs.email_address));

	return form;
};

function updateVisibility(event){
	// update gres visibility
  var partitions = document.querySelectorAll(".uva_sg_input_partition_container input[type='radio']");
  var gresSection = document.getElementById("GRES");

  var checkedPartition = Array.from(partitions).find(radio => radio.checked).value;
  var showGRES = checkedPartition && (checkedPartition === 'gpu' || checkedPartition === 'interactive');

  gresSection.style.display = showGRES ? 'block' : 'none';

	// update constraint visibility
	var gres = document.querySelectorAll(".uva_sg_input_gres_container input[type='radio']");
  var constraintSection = document.getElementById("Constraint");
  
	var checkedGRES = Array.from(gres).find(radio => radio.checked).value;
  var showConstraint = checkedGRES && checkedGRES === 'a100';

  constraintSection.style.display = (showConstraint && showGRES) ? 'block' : 'none';

	if (!showConstraint || !showGRES) {
		var constraintRadios = document.querySelectorAll(".uva_sg_input_constraint_container input[type='radio']");
		constraintRadios.forEach(radio => {
			radio.checked = false;
		});
	}

}

// Helper function to create label-input pair
UVAScriptGen.prototype.createLabelInputPair = function(labelText, inputElement) {
	var div = document.createElement("div");
	div.className = "input-pair";
	div.id = labelText.slice(0, -2);
	var label = document.createElement("label");
	label.className = "input-label";
	label.appendChild(document.createTextNode(labelText));
	div.appendChild(label);
	div.appendChild(inputElement);
	return div;
};

// Helper function to create a span element with multiple children
UVAScriptGen.prototype.newSpan = function(id, ...children) {
	var span = document.createElement("span");
	if (id) span.id = id;
	for (var child of children) {
			if (typeof child === "string") {
					span.appendChild(document.createTextNode(child));
			} else {
					span.appendChild(child);
			}
	}
	return span;
};

UVAScriptGen.prototype.retrieveValues = function() {
	var jobnotes = [];
	this.values.MB_per_core = Math.round(this.inputs.mem_per_core.value * (this.inputs.mem_units.value =="GB" ? 1024 : 1));

	this.values.features = [];
	for(var i in this.inputs.features) {
		if(this.inputs.features[i].checked){
			this.values.features.push(this.inputs.features[i].feature_name);
		} else {
		}
	}

	this.values.partitions = [];
	for(var i in this.inputs.partitions) {
		if(this.inputs.partitions[i].checked){
			this.values.partitions.push(this.inputs.partitions[i].partition_name);
		} else {
		}
	}

	// add gres
	this.values.gres = [];
	for(var i in this.inputs.gres) {
		if(this.inputs.gres[i].checked){
			this.values.gres.push(this.inputs.gres[i].gres_name);
		} else {
		}
	}

	//add constraint
	this.values.constraint = [];
	for(var i in this.inputs.constraint){
		if(this.inputs.constraint[i].checked){
			this.values.constraint.push(this.inputs.constraint[i].constraint_name);
		}else{

		}
	}

	this.values.is_requeueable = this.inputs.is_requeueable && this.inputs.is_requeueable.checked;
	this.values.walltime_in_minutes = this.inputs.wallhours.value * 3600 + this.inputs.wallmins.value * 60;
	this.values.num_tasks = this.inputs.num_tasks.value;
	this.values.num_cores = this.inputs.num_cores.value;
	if(this.inputs.single_node.checked)
		this.values.nodes = 1;
	this.values.gpus = this.inputs.num_gpus.value
	this.values.job_name = this.inputs.job_name.value;
	this.values.sendemail = {};
	this.values.sendemail.begin = this.inputs.email_begin.checked;
	this.values.sendemail.end = this.inputs.email_end.checked;
	this.values.sendemail.abort = this.inputs.email_abort.checked;
	this.values.email_address = this.inputs.email_address.value;

	/* Add warnings, etc. to jobnotes array */
	if(this.values.MB_per_core > 20*1024*1024)
		jobnotes.push("Are you crazy? That is way too much RAM!");
	if(this.values.walltime_in_minutes > 86400*7)
		jobnotes.push("Global maximum walltime is 7 days");
	if(this.values.walltime_in_minutes > 86400*3 && this.values.partitions.indexOf("p2") > -1)
		jobnotes.push("Partition p2 maximum walltime is 3 days");
	if(this.values.MB_per_core > 24*1024 && this.values.partitions.indexOf("p1") > -1)
		jobnotes.push("Partition p1 nodes have 24 GB of RAM. You want more than that per core");

	this.jobNotesDiv.innerHTML = jobnotes.join("<br/>\n");
};


UVAScriptGen.prototype.generateScriptSLURM = function () {
	var features = "";

	var scr = "#!/bin/bash\n\n#Submit this script with: sbatch thefilename\n\n";
	var sbatch = function sbatch(txt) {
		scr += "#SBATCH " + txt + "\n";
	};
	
	sbatch("--time=" + this.inputs.wallhours.value + ":" + this.inputs.wallmins.value + ":" + this.inputs.wallsecs.value + "   # walltime");
	sbatch("--ntasks=" + this.inputs.num_tasks.value + "    #number of tasks")
	var procs;
	sbatch("--ntasks-per-node=" + this.values.ntasks + "   # number of processor cores (i.e. tasks)");
	if(this.inputs.single_node.checked) {
		sbatch("--nodes=1   # number of nodes");
	}

	if(this.inputs.num_gpus.value > 0) {
		console.log("check gres")
		if(this.values.gres.length > 0) {
			var gres = this.values.gres.join(",")
			sbatch("--gres=gpu:" + gres + ":" + this.inputs.num_gpus.value)
		}else{
			sbatch("--gres=gpu:" + this.inputs.num_gpus.value);
		}
	}

	if(this.values.gres.length > 0) {
		var gres = this.values.gres.join(",")
		if(this.values.constraint.length > 0){
			var constraint = this.values.constraint.join(",")
			sbatch("--constraint=" + gres + "_" + constraint);
		}
	}

	if(this.values.features.length > 0) {
		var features = this.values.features.join("&");
		sbatch("-C '" + features + "'   # features syntax (use quotes): -C 'a&b&c&d'");
	}
	if(this.values.partitions.length > 0) {
		var partitions = this.values.partitions.join(",");
		sbatch("-p " + partitions + "   # partition(s)");
	}

	sbatch("--mem-per-cpu=" + this.inputs.mem_per_core.value + this.inputs.mem_units.value.substr(0,1) + "   # memory per CPU core");

	if(this.inputs.job_name.value && this.inputs.job_name.value != "") {
		sbatch("-J \"" + this.inputs.job_name.value + "\"   # job name");
	}
	
	if(this.inputs.email_begin.checked || this.inputs.email_end.checked || this.inputs.email_abort.checked) {
		sbatch("--mail-user=" + this.values.email_address + "   # email address");
		if(this.inputs.email_address.value == this.settings.defaults.email_address)
			scr += "echo \"$USER: Please change the --mail-user option to your real email address before submitting. Then remove this line.\"; exit 1\n";
		if(this.inputs.email_begin.checked)
			sbatch("--mail-type=BEGIN");
		if(this.inputs.email_end.checked)
			sbatch("--mail-type=END");
		if(this.inputs.email_abort.checked)
			sbatch("--mail-type=FAIL");
	}

	if(this.inputs.is_requeueable.checked)
		sbatch("--requeue   #requeue when preempted and on node failure");
	if(this.inputs.need_licenses.checked) {
		var lics = new Array();
		var show_lics = 0;
		if(this.inputs.lic0_name.value != "" && this.inputs.lic0_count.value > 0) {
			lics.push(this.inputs.lic0_name.value + ":" + this.inputs.lic0_count.value);
			show_lics = 1;
		}
		if(this.inputs.lic1_name.value != "" && this.inputs.lic1_count.value > 0) {
			lics.push(this.inputs.lic1_name.value + ":" + this.inputs.lic1_count.value);
			show_lics = 1;
		}
		if(this.inputs.lic2_name.value != "" && this.inputs.lic2_count.value > 0) {
			lics.push(this.inputs.lic2_name.value + ":" + this.inputs.lic2_count.value);
			show_lics = 1;
		}
		if(show_lics)
			sbatch("--licenses=" + lics.join(",") + "   #format: lic1_name:lic1_count,lic2_name:lic2_count");
	}
	if(this.inputs.in_group.checked) {
		sbatch("--gid=" + this.inputs.group_name.value);
	}


	scr += "\n\n# LOAD MODULES, INSERT CODE, AND RUN YOUR PROGRAMS HERE\n";
	return scr;
};

function stackTrace() {
    var err = new Error();
    return err.stack;
}

UVAScriptGen.prototype.updateJobscript = function() {
	this.retrieveValues();
	this.toJobScript();
	return;
};

UVAScriptGen.prototype.init = function() {
	this.inputDiv = document.createElement("div");
	this.inputDiv.id = "uva_sg_input_container";
	this.containerDiv.appendChild(this.inputDiv);

	var scriptHeader = document.createElement("h1");
	scriptHeader.id = "uva_sg_script_header";
	scriptHeader.appendChild(document.createTextNode("Job Script"));
	this.containerDiv.appendChild(scriptHeader);

	this.form = this.createForm();
	this.inputDiv.appendChild(this.form);

	this.jobNotesDiv = document.createElement("div");
	this.jobNotesDiv.id = "uva_sg_jobnotes";
	this.containerDiv.appendChild(this.jobNotesDiv);

	this.jobScriptDiv = document.createElement("div");
	this.jobScriptDiv.id = "uva_sg_jobscript";
	this.containerDiv.appendChild(this.jobScriptDiv);

	this.updateJobscript();
};

UVAScriptGen.prototype.toJobScript = function() {
	var scr = this.generateScriptSLURM();
	this.jobScriptDiv.innerHTML = "<pre><code>" + scr + "</code></pre>";
};