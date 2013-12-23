/***
 * taskpaper.js - Convert TaskPaper text file to HTML
 * Based heavily on tp_to_html.pl by Jim Kang
 * http://death-mountain.com/2010/05/taskpaper-to-html-conversion-script/
 *
 * @author David Hilowitz <dhilowitz@gmail.com>, Jim Kang
 **/

function TaskPaperPanel (taskDivSelector, taskPaperUrl, updateFrequency) 
{
	if($(taskDivSelector).length == 0) {
		console.log("The div selector supplied didn't turn up any divs in the document.");
		return;
	}

	this.taskDiv = taskDivSelector;
	this.taskPaperUrl = taskPaperUrl;

	this.g_indentLevel = 0;
	this.kIndentTag = "<ul>\n";
	this.kOutdentTag = "</ul>\n";
	this.kNoteClass = "tpnote";
	this.kItemTagName = "li";
	this.kTaskClass = "tptask";
	this.kTagClassPrefix = "tptag-";
	this.kTagClass = "tptag"
	this.kProjectClass = "tpproject";

	this.updateTasks();

	if(updateFrequency > 0) {
		this.intervalID = setInterval(
			(function(self) {         //Self-executing func which takes 'this' as self
				 return function() {   //Return a function in the context of 'self'
					 self.updateTasks(); //Thing you wanted to run as non-window 'this'
				 }
			})(this),
			updateFrequency
		); 
	}
}

TaskPaperPanel.prototype.updateTasks = function updateTasks() {
	if($(this.taskDiv).html().length == 0)
		$(this.taskDiv).html("Loading...");

	$.ajax({
	   // url: "https://dl.dropboxusercontent.com/s/93l33tqgh93exw8/todo.taskpaper?token_hash=AAEb8tngfY8WM_1KcbusQOpIO_jKIp48OTT54AGbVFU7ig",
	   url: this.taskPaperUrl,
	   context: this,
	   cache: false,
	   success: function(html) {
			$(this.taskDiv).html(this.convertTaskpaperToHtml(html));
	   }
	});
}



TaskPaperPanel.prototype.convertTaskpaperToHtml = function convertTaskpaperToHtml(taskPaperText) {
	outputHtml = "";

	var tppObject = this;
	$.each(taskPaperText.split('\n'), function(index) {
		var outputLine = this + '\n';
		outputLine = tppObject.tagLine(outputLine)
		outputLine = tppObject.indentLine(outputLine);
		outputHtml = outputHtml + outputLine;
	});

	// At the end of the file, close any open indentation tags.
	for (j = 0; j < this.g_indentLevel; j++)
	{
		outputHtml = outputHtml +  kOutdentTag;
	}
	return "<ul class=\"tptop\">" + outputHtml + "</ul>";
}

// Adds the necessary tags to indent the line as needed and returns the indented line.
// Updates the global $g_indentLevel variable.
TaskPaperPanel.prototype.indentLine = function indentLine(line)
{	
	// Count the tabs.
	var tabCount = this.numberOfTabs(line);	
		
	if (this.g_indentLevel != tabCount)
	{
		var tag = this.kOutdentTag;		
		if (this.g_indentLevel < tabCount)
		{
			tag = this.kIndentTag;
		}		
		
		for (i = 0; i < Math.abs(this.g_indentLevel - tabCount); ++i)
		{
			// Set up the right number of tabs. (Need the tabs to make the html source readable.)			
			var tabsForThisLine = "";
			var numberOfOutputTabs = i;
			if(this.g_indentLevel < tabCount)
			{
				numberOfOutputTabs = this.g_indentLevel - i;
			}
			
			for (var j = 0; j < numberOfOutputTabs; ++j)
			{
				tabsForThisLine = tabsForThisLine + "\t";
			}			
			
			// Add the tabs and indent tag.
			line = tabsForThisLine + tag + line;
		}		
		
		this.g_indentLevel = tabCount;
	}
	
	return line;
 }

// // Returns the line with the appropriate tags added.
TaskPaperPanel.prototype.tagLine = function tagLine(line) {
	
	var itemClass = this.kNoteClass;
	
	// 	If it starts with "- ", it's a task.
	if (line.match(/^(\s*)\- /))
	{
		itemClass = this.kTaskClass;
		line = line.replace(/^(\s*)\- /, "$1");

		tags = line.match(/@[^\s]+/g);

		if(tags != undefined) {
			for(var i = 0; i < tags.length; i++) {
				var originalTag = tags[i];
				line = line.replace(originalTag, "<span class=\"" + this.kTagClass + "\">" + originalTag + "</span>");
				originalTag = originalTag.replace("@","");

				// Remove parameterized stuff
				currentTag = originalTag.replace(/([^\s\(\)]+)\s*\(.*\)/,"$1");
				itemClass = itemClass + " " + this.kTagClassPrefix + currentTag;
				
				// Add parameterized stuff
				if(originalTag.match(/(.+)\((.*)\)/)) {
					parameterTag = originalTag.replace(/(.+)\((.*)\)/,"$1-$2");
					if(parameterTag.length > 0)
						itemClass = itemClass + " " + this.kTagClassPrefix + parameterTag;
				}
			}
		}

	}
	else 
	{
		// If it ends with ":", it's a project.
		if (line.match(/:\s*$/))
		{
			itemClass = this.kProjectClass;
			line = line.replace(/:\s*$/, "\n"); // Get rid of the ":".
		}
	}
	
	openTag = "<" + this.kItemTagName + " class=\"" + itemClass + "\">";
	closeTag = "</" + this.kItemTagName + ">";
	
	// Squeeze the opening and closing tags in after the whitespace at the beginning 
	// of the line and at the end of the line, respectively.
	line = line.replace(/^(\s*)(.*)/, "$1" + openTag + "$2" + closeTag + "\n");
	return line;

}

// Returns the number of tabs at the start of the screen
TaskPaperPanel.prototype.numberOfTabs = function numberOfTabs(text) {
  var count = 0;
  var index = 0;
  while (text.charAt(index++) === "\t") {
	count++;
  }
  return count;
}

