var ConnectEvents;
(function (ConnectEvents){
        ConnectEvents.curPlayer = 0;
        var defensePattern = {}, offensePattern = {};
        var addChip = function($aCol){
            
            //get current column
            var curCol = $aCol.index() + 1;
            //get all circles of current column
            var $curCols = $(Context.ID_BOARD).find(".col-" + curCol);
           
            var success = false;
            $.each($curCols, function(i){
                 //TODO:animate as falling object 
                if(isValidSlot(i, $curCols)){
                    if(BoardUtil.STATUS == Context.STATUS_GAME_OVER){
                        return false;
                    }
                    success = true;
                    $(this).find(Context.CLS_CIRCLE).addClass(Context.PLAYERS[ConnectEvents.curPlayer]);
                    if(hasWinner($(this))){
                         proclaimWinner();
                        return true;
                    }
                    else if(isDraw()){
                        proclaimDraw();
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
              if($aCurCols.eq(aIdx).find(Context.CLS_CIRCLE).hasClass(Context.PLAYERS[0])
                    || $aCurCols.eq(aIdx).find(Context.CLS_CIRCLE).hasClass(Context.PLAYERS[1])){
                     return false;
                }
               //when current column is full
              if($aCurCols.find("." + Context.PLAYERS[0] + ", ." + Context.PLAYERS[1]).length >= 6){
                        return false;
              }
              //when last slot
              if(aIdx == $aCurCols.length - 1){
                    if($aCurCols.eq(aIdx).find(Context.CLS_CIRCLE).hasClass(Context.PLAYERS[0])
                        || $aCurCols.eq(aIdx).find(Context.CLS_CIRCLE).hasClass(Context.PLAYERS[1])
                    ){ //next slot is done
                        return false;
                    }
                    return true;
              }
                //next slot is done
              else if($aCurCols.eq(aIdx + 1).find(Context.CLS_CIRCLE).hasClass(Context.PLAYERS[0])
                    || $aCurCols.eq(aIdx + 1).find(Context.CLS_CIRCLE).hasClass(Context.PLAYERS[1])){ 
                    return true;
              }
              return false;
        },
        hasWinner = function($aCell){
            if(isConnected(getHorizonal($aCell)) == true
                    || isConnected(getVertical($aCell)) == true
                    || isConnected(getDiagonalS($aCell)) == true
                    || isConnected(getDiagonalX($aCell)) == true
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
        }
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
        getDiagonalX = function($aCell){
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
        },
        computerMove = function($aPrevMove){
            var offense = 1, defense = 0;
           setMove(getHorizonal($aPrevMove), defense)
           setMove(getVertical($aPrevMove), defense)
           setMove(getDiagonalS($aPrevMove), defense)
           setMove(getDiagonalX($aPrevMove), defense)
           setMove(getHorizonal($aPrevMove), offense)
           setMove(getVertical($aPrevMove), offense)
           setMove(getDiagonalS($aPrevMove), offense)
           setMove(getDiagonalX($aPrevMove), offense)
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
        }, setBestMove = function(){
            var offensMax = 0; defenseMax = 0, offenseKey = null, defenseKey = null;
            for(key in defensePattern){
                if(defensePattern[key].count > defenseMax){
                    defenseMax = defensePattern[key].count;
                    defenseKey = key;
                }
            }
             for(key in offensePattern){
                if(offensePattern[key].count > offensMax){
                    offensMax = offensePattern[key].count;
                    offenseKey = key;
                }
            }
            //prioritize defense
            var $cells = null, moveType = 0;
            if(defenseMax >= offensMax){
                $cells = defensePattern[defenseKey].pattern;
                moveType = 0; //defensive mode
            }
            else{
                $cells = offensePattern[offenseKey].pattern;
                moveType = 1; //offensive mode
            }
            var chipsClass = [".",Context.PLAYERS[0],", .",Context.PLAYERS[1]].join("");
            for(var i=1; i<$cells.length; i++){
                var $cell = $cells.eq(i);
                //when current cell has opponent chip
                if($cell.find("." + Context.PLAYERS[moveType]).length > 0){
                    //when previous cell is available
                    if($cells.eq(i - 1).find(".circle").length > 0 && $cells.eq(i - 1).find(chipsClass).length == 0){
                        addChip($cells.eq(i - 1));
                        return true;
                    }
                    //when next cell is available
                    if($cells.length - 1 > i){
                        if($cells.eq(i + 1).find(".circle").length > 0 && $cells.eq(i + 1).find(chipsClass).length == 0){
                            addChip($cells.eq(i + 1));
                            return true;
                        }
                    }
                }
            }
            return false;
         }
         ,setMove = function($aCells, moveType){
            if($aCells.length == $aCells.find([".",Context.PLAYERS[0],", .",Context.PLAYERS[1]].join("")).length){
                return;
            }
            var ctr = 0, hasMoved = false;
            $.each($aCells, function(i){
                var $chip = $(this).find(".circle"), $ret = null;
                var pattern = moveType == 0 ? defensePattern : offensePattern;
                if($chip.hasClass(Context.PLAYERS[moveType])){
                    if(++ctr >= 2){
                        var id = $(this).attr("id");
                        if(!pattern.hasOwnProperty(id)){
                            pattern[id] = {count:ctr, pattern:$aCells};
                        }
                        if(pattern[id].count < ctr){
                            pattern[id].count = ctr
                            pattern[id].pattern = $aCells;
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
                     $(Context.ID_BOARD).find("." + Context.CONNECTED).removeClass(Context.CONNECTED);
                }
             });
            return ret;
        }, proclaimWinner = function(){
            BoardUtil.STATUS = Context.STATUS_GAME_OVER;
            var players = ["Player A", "player B"];
            //reset those not connected
            resetSlots($(Context.ID_BOARD).find(Context.CLS_CIRCLE + ":not(." + Context.CONNECTED + ")"));          
            //show winner
            alert(players[ConnectEvents.curPlayer] + " wins!");
             //reset remaining
           // resetSlots($(Context.ID_BOARD).find(Context.CLS_CIRCLE));
            ConnectEvents.curPlayer = 0;
            defensePattern = {}, offensePattern = {}
        }, proclaimDraw = function(){
             BoardUtil.STATUS = Context.STATUS_GAME_OVER;
            alert("It's a draw!");
             //reset
            //resetSlots($(Context.ID_BOARD).find(Context.CLS_CIRCLE));
            ConnectEvents.curPlayer = 0;
            defensePattern = {}, offensePattern = {}
        }, resetSlots = function($aSlots){
            $aSlots.removeClass(Context.PLAYERS[0]).removeClass(Context.PLAYERS[1]).removeClass(Context.CONNECTED);
        }
	ConnectEvents.initialize = function(){
            var $board = $(Context.ID_BOARD);
            $board.unbind().bind("click", function(e){
                if(BoardUtil.STATUS != Context.STATUS_READY){
                    return;
                }
                if($(e.target).hasClass("circle")){
                    addChip($(e.target).closest(".col"));
                }
                else if($(e.target).hasClass("col")){
                    addChip($(e.target));
                }
                if(Context.OPPONENT == 1 && ConnectEvents.curPlayer == 1
                    && BoardUtil.STATUS == Context.STATUS_READY
                ){
                    BoardUtil.STATUS = Context.STATUS_BUSY;
                    setTimeout(function(){
                        computerMove($(e.target).closest(".col"));
                        BoardUtil.STATUS = Context.STATUS_READY;
                    },500);
                }
            });
            $("#btn-start").unbind().bind("click", function(){
                BoardUtil.initialize();
            });
            $("[name='opponent']").unbind().bind("click", function(){
                 Context.OPPONENT = parseInt($(this).val());
                 BoardUtil.initialize();
                 if($(this).attr("id") == "opt-computer"){
                     ConnectEvents.curPlayer = 0; //human first move;
                 }
                
            });
	}
})(ConnectEvents || (ConnectEvents = {}));
