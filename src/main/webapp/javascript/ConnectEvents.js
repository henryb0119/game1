var ConnectEvents;
(function (ConnectEvents){
	ConnectEvents.curPlayer = 0;
	ConnectEvents.lockPlayer = false;
	var defensePattern = {}, offensePattern = {};
	var addChip = function($aCol){
		if(ConnectEvents.lockPlayer){
			return;
		}
		//get current column
		var curCol = $aCol.index() + 1;
		//get all circles of current column
		var $curCols = $(Context.ID_BOARD).find(".col-" + curCol);

		var success = false;
		$.each($curCols, function(i){
			//TODO:animate as falling object 
			if(isValidSlot(i, $curCols)){
				if(Observer.getStatus() != Context.STATUS_READY /*human move*/
					&& Observer.getStatus() != Context.STATUS_BUSY /*computer move*/
				){
					return false;
				}
				success = true;
				$lastMove = $(this);
				$(this).find(Context.CLASS_CIRCLE).addClass(Context.PLAYERS[ConnectEvents.curPlayer]);
				if(hasWinner($(this))){
					Observer.setStatus(Context.STATUS_WINNER);
					ConnectEvents.lockPlayer = true;
					var $connected = $(Context.ID_BOARD).find("." + Context.CONNECTED);
					blinkChips($connected);
					return true;
				}
				else if(isDraw()){
					ConnectEvents.lockPlayer = true;
					Observer.setStatus(Context.STATUS_DRAW);
					return true;
				}
				ConnectEvents.curPlayer = ConnectEvents.curPlayer == 1 ? 0 : 1; //set next player
				return;
			};
		});
		return success;
	},
	isValidSlot = function(aIdx, $aCurCols){
		//when current slot has chip
		if($aCurCols.eq(aIdx).find(Context.CLASS_CIRCLE).hasClass(Context.PLAYERS[0])
				|| $aCurCols.eq(aIdx).find(Context.CLASS_CIRCLE).hasClass(Context.PLAYERS[1])){
			return false;
		}
		//when current column is full
		if($aCurCols.find("." + Context.PLAYERS[0] + ", ." + Context.PLAYERS[1]).length >= 6){
			return false;
		}
		//when last slot
		if(aIdx == $aCurCols.length - 1){
			if($aCurCols.eq(aIdx).find(Context.CLASS_CIRCLE).hasClass(Context.PLAYERS[0])
					|| $aCurCols.eq(aIdx).find(Context.CLASS_CIRCLE).hasClass(Context.PLAYERS[1])
			){ //next slot is done
				return false;
			}
			return true;
		}
		//next slot is done
		else if($aCurCols.eq(aIdx + 1).find(Context.CLASS_CIRCLE).hasClass(Context.PLAYERS[0])
				|| $aCurCols.eq(aIdx + 1).find(Context.CLASS_CIRCLE).hasClass(Context.PLAYERS[1])){ 
			return true;
		}
		return false;
	},
	hasWinner = function($aCell){
		if(isConnected(getHorizonal($aCell)) == true
				|| isConnected(getVertical($aCell)) == true
				|| isConnected(getDiagonalS($aCell)) == true
				|| isConnected(getDiagonalN($aCell)) == true
		){
			return true;
		}
		return false;
	},
	isDraw = function (){
		if ($(Context.ID_BOARD).find("." + Context.PLAYERS[0] + ", ." + Context.PLAYERS[1]).length >= 7 * 6){
			return true;
		}
		return false;
	};
	getHorizonal = function($aCell){
		return $aCell.closest(".row").find(".col");
	},
	getVertical = function($aCell){
		var curCol = $aCell.index() + 1; //current column
		return $aCell.closest(Context.ID_BOARD).find(".col-" + curCol);
	},
	getDiagonalS = function($aCell){
		var startCol = 0, 
		startRow = $aCell.closest(".row").index() - $aCell.index(), 
		ne = "diagonal";

		if(startRow < 0){
			startCol =- startRow;
			startRow = 0;
		}
		for(var i=startRow,c=startCol; i<8; i++, c++){
			var $curCell = $("#R"+i+"C"+c);
			if($curCell.length == 0){
				break;
			}
			$curCell.addClass(ne);
		}
		var $retVal =  $aCell.closest(Context.ID_BOARD).find("." + ne).removeClass(ne);
		return $retVal;
	},
	getDiagonalN = function($aCell){
		var maxRowIdx=5,
		startCol = $aCell.index() - (maxRowIdx - $aCell.closest(".row").index()), 
		startRow = $aCell.closest(".row").index() + $aCell.index(), 
		ne = "diagonal";

		if(startRow > 5){
			startRow = 5;
		}
		if(startCol < 0){
			startCol = 0;
		}
		for(var i=startRow,c=startCol; i>=0; i--, c++){
			var $curCell = $("#R"+i+"C"+c);
			if($curCell.length == 0){
				break;
			}
			$curCell.addClass(ne);
		}
		var $retVal =  $(Context.ID_BOARD).find("." + ne).removeClass(ne);
		return $retVal;
	}, getLastMovePerColumn = function(){
		var lastMoves = new Array();
		for(var col=1; col<=Context.MAX_X; col++){
			var $curColumn = $(Context.ID_BOARD).find(".col-" + col),
			    chips = $curColumn.find("." + Context.PLAYERS[0] + ", ." + Context.PLAYERS[1]);
			if(chips.length > 0){
				lastMoves.push(chips.eq(0).closest(".col"));
			}
		}
		return lastMoves;
	},
	computerMove = function($aPrevMove){
		var offense = 1, defense = 0,
		$possibleMoves = getLastMovePerColumn();
		$.each($possibleMoves, function(){
			var hPattern = getHorizonal($(this)),
			vPattern = getVertical($(this)),
			dsPattern = getDiagonalS($(this)),
			dnPattern = getDiagonalN($(this));
			
			checkMove(hPattern, defense, Context.PATTERN.HORIZONTAL);
			checkMove(vPattern, defense, Context.PATTERN.VERTICAL);
			checkMove(dsPattern, defense, Context.PATTERN.DIAGONALS);
			checkMove(dnPattern, defense, Context.PATTERN.DIAGONALN);
			checkMove(hPattern, offense, Context.PATTERN.HORIZONTAL);
			checkMove(vPattern, offense, Context.PATTERN.VERTICAL);
			checkMove(dsPattern, offense, Context.PATTERN.DIAGONALN);
			checkMove(dnPattern, offense, Context.PATTERN.DIAGONALS);
		});
		
		var hasBestMove = false;
		if(Object.keys(defensePattern).length > 0 || Object.keys(offensePattern).length > 0){
			hasBestMove = setBestMove();
		}
		if(!hasBestMove){
			//out of move
			var $slots = $(Context.ID_BOARD).find(".circle").not("." + Context.PLAYERS[0] + ", ." + Context.PLAYERS[1]);
			var moved = false, ctr = 0;
			while (!moved) {
				moved = addChip($slots.eq(Math.floor(Math.random() * $slots.length)).closest(".col")); //make move;
				if(ctr++ > (7*6)){
					break;
				}
			}
		}
	},setBestMove = function(){
		var offensMax = 0; defenseMax = 0, offenseKey = null, slotId = null;
		for(var key in defensePattern){
			for (var pattern in defensePattern[key]){
				if(defensePattern[key][pattern] > defenseMax){
					defenseMax = defensePattern[key][pattern];
					slotId = key;
				}
			}
		}
		for(key in offensePattern){
			for (var pattern in offensePattern[key]){
				if(offensePattern[key][pattern] > defenseMax){
					defenseMax = offensePattern[key][pattern];
					slotId = key;
				}
			}
		}
		if(defenseMax < 2 && defenseMax < 2){
			return false;
		}
		//sure win otherwise prioritize defense
		if(offensMax == 3 || offensMax > defenseMax){
			addChip($("#" + slotId).closest(".col"));
			delete offensePattern[slotId];
			return true;
		}
		else{
			addChip($("#" + slotId).closest(".col"));
			delete defensePattern[slotId];
			return true;
		}
		
	}
	,checkMove = function($aCells, aMoveType, aPattern){
		if($aCells.length == $aCells.find([".",Context.PLAYERS[0],", .",Context.PLAYERS[1]].join("")).length){
			return;
		}
		var ctr = 0, nxtIdx = 0, prvIdx = 0, validCell = null;
		$.each($aCells, function(i){
			
			var $chip = $(this).find(".circle");
			var pattern = aMoveType == 0 ? defensePattern : offensePattern;
			if($chip.hasClass(Context.PLAYERS[aMoveType])){
				if(++ctr >= 2){
					validCell = null;
					if($aCells.eq(i+1).length > 0){
						nxtIdx = $aCells.eq(i+1).index() + 1;
						var $curCols = $(Context.ID_BOARD).find(".col-" + nxtIdx);
						if(isValidSlot($aCells.eq(i+1).closest(".row").index(), $curCols)){
							validCell = $aCells.eq(i+1);
						}
					}
					if(validCell == null && $aCells.eq(i-ctr).length > 0){
						prvIdx = $aCells.eq(i-ctr).index() + 1;
						var $curCols = $(Context.ID_BOARD).find(".col-" + prvIdx);
						if(isValidSlot($aCells.eq(i-ctr).closest(".row").index(), $curCols)){
							validCell = $aCells.eq(i-ctr);
						}
					}
					if(validCell != null){
						var id = validCell.attr("id");
						if(!pattern.hasOwnProperty(id)){
							pattern[id] = {};
						}
						if(!pattern[id].hasOwnProperty(aPattern) || pattern[id][aPattern] < ctr){
							pattern[id][aPattern] = ctr;
						}
					}
					else{
						ctr = 0;
					}
				}
			}
			else{
				ctr = 0;
			}
		});
	},
	isConnected = function($aCells, $aCell){
		var ctr = 0, ret = false;
		$.each($aCells, function(i){
			var $chip = $(this).find(".circle");
			if($chip.hasClass(Context.PLAYERS[ConnectEvents.curPlayer])){
				$chip.addClass(Context.CONNECTED);
				if(++ctr >= 4){
					ret = true;
					return;
				}
			}
			else if(ctr >= 4){
				ret = true;
				return;
			}
			else{
				ctr = 0;
			}
		});
		if(!ret){
			$(Context.ID_BOARD).find("." + Context.CONNECTED).removeClass(Context.CONNECTED);
		}
		return ret;
	}, resetSlots = function($aSlots){
		$aSlots.removeClass(Context.PLAYERS[0]).removeClass(Context.PLAYERS[1]).removeClass(Context.CONNECTED);
	}, blinkChips = function($chips){
		setTimeout(function(arg){
			if(arg[0].hasClass(Context.CLASS_BLINK)){
				arg[0].removeClass(Context.CLASS_BLINK);
			}
			else{
				arg[0].addClass(Context.CLASS_BLINK);
			}
			if(arg[0].eq(0).hasClass(Context.CONNECTED)){
				blinkChips(arg[0]);
			}
		},500,[$chips]);
	}
	ConnectEvents.initialize = function(){
		var $board = $(Context.ID_BOARD);
		defensePattern = {};
		offensePattern = {};
		$board.unbind().bind("click", function(e){
			if(Observer.getStatus() == Context.STATUS_BUSY){
				return;
			};
			if($(e.target).hasClass("circle")){
				addChip($(e.target).closest(".col"));
			}
			else if($(e.target).hasClass("col")){
				addChip($(e.target));
			}
			if(Context.OPPONENT == 1 && ConnectEvents.curPlayer == 1
					&& Observer.getStatus() == Context.STATUS_READY
			){
				Observer.setStatus(Context.STATUS_BUSY);
				setTimeout(function(){
					if(Observer.getStatus() == Context.STATUS_WINNER){
						return;
					}
					computerMove();
					Observer.setStatus(Context.STATUS_READY);
				},500);
			}
		});
		$("#btn-start").unbind().bind("click", function(){
			BoardUtil.initialize();
			if($("#player-1").val() == ""){
				$("#player-1").val("Player A");
			}
			if($("#player-2").val() == ""){
				$("#player-2").val("Player B");
			}
			Observer.setStatus(Context.STATUS_READY);
			if(Context.OPPONENT == 1){
				ConnectEvents.curPlayer = 0;
			}
			ConnectEvents.lockPlayer = false;
		});
		$("[name='opponent']").unbind().bind("click", function(){
			Context.OPPONENT = parseInt($(this).val());
			BoardUtil.initialize();
			if($(this).attr("id") == "opt-computer"){
				ConnectEvents.curPlayer = 0; //human first move;
				$("#player-2").val("Computer").attr("readOnly", "readonly");
			}

		});
	};
})(ConnectEvents || (ConnectEvents = {}));
