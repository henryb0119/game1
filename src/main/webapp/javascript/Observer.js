var Observer;
(function (Observer){
	var status = Context.STATUS_READY,
	observeStatus = function(){
		switch (status){ 
		case Context.STATUS_READY:
			MessageUtil.clearMessage();
			break;
		case Context.STATUS_WINNER:
			proclaimWinner();
			break;
		case Context.STATUS_DRAW:
			declareDraw();
			break;
		}
		
	},proclaimWinner = function(){
		MessageUtil.showMessage(Context.MESSAGE_WINNER.replace("<player>", $("#player-" + (ConnectEvents.curPlayer + 1)).val()), MessageUtil.ALERT);
	},declareDraw = function(){
		MessageUtil.showMessage(Context.MESSAGE_DRAW, MessageUtil.ALERT);
	};
	Observer.setStatus = function(aStatus){
		status = aStatus;
		observeStatus();
	};
	Observer.getStatus = function(){
		return status;
	};
	
	
})(Observer || (Observer = {}));