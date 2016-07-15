var ElementFactory = new function() {
	this.add = function(tagName, aProperty, $aParent){
		var elems = ["<", tagName], space = " ", eq = "=", qt = "'";
		for(var key in aProperty){
			elems.push(space);
			elems.push(key);
			elems.push(eq);
			elems.push(qt);
			elems.push(aProperty[key]);
			elems.push(qt);
		}
		elems.push(" />");
		$aParent.append(elems.join(""));
	}
}