var Context = new function() {
	this.ID_BOARD = "#board-box";
	this.CLASS_CIRCLE = ".circle";
	this.PLAYERS = ["playerA", "playerB"];
	this.OPPONENTS = ["Human", "Computer"];
	this.PATTERN = {VERTICAL:"vp", HORIZONTAL:"hp", DIAGONALS:"ds",DIAGONALN:"dn"};
	this.OPPONENT = 0; //default - human
	this.CONNECTED = "connected";
	this.PATTERNS = ["horizontal", "vertical", "diagonal-s","diagonal-x"];
	this.STATUS_READY = 0;
	this.STATUS_BUSY = 1;
	this.STATUS_WINNER = 2;
	this.STATUS_DRAW = 3;
	this.MAX_Y = 6;
	this.MAX_X = 7;
	this.CLASS_BLINK = "blink";
	this.MESSAGE_WINNER = "<player> Wins!";
	
};