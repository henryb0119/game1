var Context = new function() {
	this.ID_BOARD = "#board-box";
        this.CLS_CIRCLE = ".circle";
        this.PLAYERS = ["playerA", "playerB"];
        this.OPPONENTS = ["Human", "Computer"];
        this.OPPONENT = 0; //default - human
        this.CONNECTED = "connected";
        this.PATTERNS = ["horizontal", "vertical", "diagonal-s","diagonal-x"];
        this.STATUS_READY = 0;
        this.STATUS_BUSY = 1;
        this.STATUS_GAME_OVER = 2;

}