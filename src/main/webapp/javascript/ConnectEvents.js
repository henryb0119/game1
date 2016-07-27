var ConnectEvents;
(function (ConnectEvents){
	//default player
	ConnectEvents.curPlayer = Context.PLAYER_MAIN;
	ConnectEvents.lockPlayer = false; //set to true after start button is clicked
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
			//check if it has a valid slot
			if(isValidSlot(i, $curCols)){
				//check if valid to move
				if(Observer.getStatus() != Context.STATUS_READY /*human move*/
					&& Observer.getStatus() != Context.STATUS_BUSY /*computer move*/
				){
					return false;
				}
				//add the chip virtually
				$(this).find(Context.CLASS_CIRCLE).addClass(Context.PLAYERS[ConnectEvents.curPlayer]);
				success = true;
				
				if(hasWinner($(this))){
					//inform winner
					Observer.setStatus(Context.STATUS_WINNER);
					ConnectEvents.lockPlayer = true;
					var $connected = $(Context.ID_BOARD).find("." + Context.CONNECTED);
					//double check connected chips
					if($connected.length > 4){
						var ctr = 0;
						$.each($connected, function(){
							if(!$(this).hasClass(Context.PLAYERS[ConnectEvents.curPlayer]) || ++ctr > 4
							){
								$(this).removeClass(Context.CONNECTED);
							}
						});
					}
					//new set
					blinkChips($(Context.ID_BOARD).find("." + Context.CONNECTED));
					return true;
				}
				else if(isDraw()){
					ConnectEvents.lockPlayer = true;
					Observer.setStatus(Context.STATUS_DRAW);
					return true;
				}
				//store last player move
				Observer.setLastMove(ConnectEvents.curPlayer);
				//change player
				ConnectEvents.curPlayer = ConnectEvents.curPlayer == Context.PLAYER_OPPONENT ? Context.PLAYER_MAIN : Context.PLAYER_OPPONENT; //set next player
				Observer.setStatus(Context.STATUS_READY);
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
		var $slots = $(Context.ID_BOARD).find(".circle").not("." + Context.PLAYERS[0] + ", ." + Context.PLAYERS[1]);
		return $slots.length == 0; //no available slot
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
		$possibleMoves = getLastMovePerColumn();//get all possible moves;
		$.each($possibleMoves, function(){
//			ignore if no possible move to the current column
			if($(this).closest(".row").index() == 0){
				return;
			}
			var $lastMove = $(this); 
			var curCol = $(this).find(".circle").index() + 1; //current column index
			//available slot of current column
			var $availSlot = $(this).closest(".row").prev().find(".col-" + curCol);
			//read the possible pattern connection based from the last move per column
			var hLPattern = getHorizonal($lastMove),
			vLPattern = getVertical($lastMove),
			dsLPattern = getDiagonalS($lastMove),
			dnLPattern = getDiagonalN($lastMove);
			//read the possible pattern connection  based from the available slot per column
			var hAPattern = getHorizonal($availSlot),
			vAPattern = getVertical($availSlot),
			dsAPattern = getDiagonalS($availSlot),
			dnAPattern = getDiagonalN($availSlot);
			
			//check next possible move offensively
			checkMove($availSlot, hLPattern, offense, Context.PATTERN.HORIZONTAL);
			checkMove($availSlot, vLPattern, offense, Context.PATTERN.VERTICAL);
			checkMove($availSlot, dsLPattern, offense, Context.PATTERN.DIAGONALS);
			checkMove($availSlot, dnLPattern, offense, Context.PATTERN.DIAGONALN);
			checkMove($availSlot, hAPattern, offense, Context.PATTERN.HORIZONTAL);
			checkMove($availSlot, vAPattern, offense, Context.PATTERN.VERTICAL);
			checkMove($availSlot, dsAPattern, offense, Context.PATTERN.DIAGONALN);
			checkMove($availSlot, dnAPattern, offense, Context.PATTERN.DIAGONALS);
			//check next possible move defensively
			checkMove($availSlot, hLPattern, defense, Context.PATTERN.HORIZONTAL);
			checkMove($availSlot, vLPattern, defense, Context.PATTERN.VERTICAL);
			checkMove($availSlot, dsLPattern, defense, Context.PATTERN.DIAGONALS);
			checkMove($availSlot, dnLPattern, defense, Context.PATTERN.DIAGONALN);
			checkMove($availSlot, hAPattern, defense, Context.PATTERN.HORIZONTAL);
			checkMove($availSlot, vAPattern, defense, Context.PATTERN.VERTICAL);
			checkMove($availSlot, dsAPattern, defense, Context.PATTERN.DIAGONALN);
			checkMove($availSlot, dnAPattern, defense, Context.PATTERN.DIAGONALS);
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
		var offensMax = 0; defenseMax = 0
			, offenseId = null, defenseId = null;
		for(var key in defensePattern){
			for (var pattern in defensePattern[key]){
				if(defensePattern[key][pattern] > defenseMax){
					defenseMax = defensePattern[key][pattern];
					defenseId = key;
				}
			}
		}
		for(key in offensePattern){
			for (var pattern in offensePattern[key]){
				if(offensePattern[key][pattern] > offensMax){
					offensMax = offensePattern[key][pattern];
					offenseId = key;
				}
			}
		}
		if(defenseMax < 2 && offensMax < 2){
			return false;
		}
		//prioritize sure win otherwise prioritize defense
		var chipAdded = false;
		if(offensMax == 3 || offensMax > defenseMax){
			chipAdded = addChip($("#" + offenseId).closest(".col"));
			delete offensePattern[offenseId];
		}
		if(!chipAdded){
			chipAdded = addChip($("#" + defenseId).closest(".col"));
			delete defensePattern[defenseId];
		}
		return chipAdded;	
	}
	,checkMove = function(aCell, $aCells, aMoveType, aPattern){
		var playerClass = [".",Context.PLAYERS[0],", .",Context.PLAYERS[1]].join("");
		//for assurance of draw - to be deleted later
		if($aCells.length == $aCells.find(playerClass).length){
			return;
		}
		
		var ctr = 0, baseColId = aCell.find(".circle").attr("id");
		
		var addPossibleMove = function($possibleSlot, aMoveType){
			var pattern = aMoveType == 0 ? defensePattern : offensePattern;
			//get current column
			var curCol = $possibleSlot.index() + 1;
			//get all circles of current column
			var $curCols = $(Context.ID_BOARD).find(".col-" + curCol);
			if(isValidSlot($possibleSlot.closest(".row").index(), $curCols)){
				var id = $possibleSlot.find(".circle").attr("id");
				if(!pattern.hasOwnProperty(id)){
					pattern[id] = {};
				}
				if(!pattern[id].hasOwnProperty(aPattern) || pattern[id][aPattern] < ctr){
					pattern[id][aPattern] = ctr;
				}
			}
		};
		
		for(var i=$aCells.length-1; i>0; i--){
			var $this = $aCells.eq(i);
			if(baseColId == $this.find(".circle").attr("id")){
				continue;
			}
			var $chip = $this.find(".circle");
			
			
			//a player has chip on current slot
			if($chip.hasClass(Context.PLAYERS[aMoveType])){
//				has 2 or 3 connections and next slot is empty
				if( ++ctr >= 2){
					//collect possible moves
					//check slot above current slot
					if($aCells.eq(i-1).find(playerClass).length == 0){
						addPossibleMove($aCells.eq(i-1), aMoveType);
					}
					//check slot below current slot
					if((i + ctr) < $aCells.length){
						addPossibleMove($aCells.eq(i + ctr), aMoveType);
					}
				}
			}
			else{
				ctr = 0;
			}
		};
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
	};
	ConnectEvents.initialize = function(){
		var $board = $(Context.ID_BOARD);
		defensePattern = {};
		offensePattern = {};
		$board.unbind().bind("click", function(e){
			if(Observer.getStatus() == Context.STATUS_BUSY){
//				computer's turn
				return;
			};
			if($(e.target).hasClass("circle")){
				addChip($(e.target).closest(".col"));
			}
			else if($(e.target).hasClass("col")){
				addChip($(e.target));
			}
			if(Context.OPPONENT == Context.OPPONENT_COMPUTER && ConnectEvents.curPlayer == Context.PLAYER_OPPONENT
					&& Observer.getStatus() == Context.STATUS_READY
			){
				Observer.setStatus(Context.STATUS_BUSY);
				setTimeout(function(){
					if(Observer.getStatus() == Context.STATUS_WINNER){
						return;
					}
					computerMove();
					
				},500);
			}
		});
		//START BUTTON
		$("#btn-start").unbind().bind("click", function(){
			BoardUtil.initialize();
			//add player name if not specified
			if($("#player-1").val() == ""){
				$("#player-1").val("Player A");
			}
			if($("#player-2").val() == ""){
				$("#player-2").val("Player B");
			}
			//set ready to move
			Observer.setStatus(Context.STATUS_READY);
			if(Context.OPPONENT == Context.OPPONENT_COMPUTER){
				ConnectEvents.curPlayer = Context.PLAYER_MAIN;
			}
			ConnectEvents.lockPlayer = false;
		});
		
		$("[name='opponent']").unbind().bind("click", function(){
			//set the opponent
			Context.OPPONENT = parseInt($(this).val());
			//reset board
			BoardUtil.initialize();
			if($(this).attr("id") == "opt-computer"){
				ConnectEvents.curPlayer = Context.PLAYER_MAIN; //human first move;
				//set player 2 name as computer and set to read only
				$("#player-2").val("Computer").attr("readOnly", "readonly");
			}
			else{
				//remove read only attribute
				$("#player-2").val("").removeAttr("readOnly");
			}

		});
	};
})(ConnectEvents || (ConnectEvents = {}));
