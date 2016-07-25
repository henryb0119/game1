var MessageUtil;
(function (MessageUtil){
	
//	var messageType = null;
	MessageUtil.showMessage = function(aMessage, aType){
		if(typeof aMessage == "undefined" || aMessage == null){
			return;
		}
		$("#connect-msg").html(["<label class='",aType,"'>",aMessage,"</label>"].join("")).show();
	};
	MessageUtil.clearMessage = function(aMessage, aType){
		$("#connect-msg").html("").hide();
	};
	
	MessageUtil.ALERT = "alert";
	MessageUtil.WARNING = "warning";
	MessageUtil.GENERAL = "general";
})(MessageUtil || (MessageUtil = {}));