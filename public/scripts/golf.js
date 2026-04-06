let globals = {"problemJSON":null, "tree":null}
//let sentence = "Mary had a little lamb" // default sentence but can be replaced by input
$(document).ready(init)

function init() {

    if (window.location.href.includes("localhost")){
        fetch(`/set_NetID?netID=liu36`)
    }

    let problem_id = parseQuery(window.location.search).problem_id || 7
    
JSON_API(undefined, problem_id)
        .then((data) => {
            // console.log({data})
            globals.problemJSON = data
            let problemJSON = globals.problemJSON;
            let startingSentence = parseQuery(window.location.search).string 
            // || "(S (NP Mary) (VP (V had) (NP (D a) (N' (Adj little) (N lamb)))))"
            //let sentence = treeToString(parse(bracketedSentence))
            if (startingSentence) {
                problemJSON.holes[0].expression = startingSentence
                problemJSON.holes = [problemJSON.holes[0]]
                problemJSON.description = "tests"
            }
           // sendJSON(problemJSON, 1)
            loadMenu()
            hashLoadSentence()
            intro()
        })
}

function loadMenu() {
    let problemJSON = globals.problemJSON;
    mode = parseQuery(window.location.search).mode || 'automatic'
    if (mode == 'manual') {
        $("#menu").append($("<div/>", { html: "Check Answer", class: "button" }).on({
            "click": function (e) {
                if (getTree().replace(/  +/g, ' ') == bracketedSentence) {
                    //console.log("Correct!") 
                    alert("Correct!")
                } else if (isValid(globals.tree, getRows())) {
                    //console.log("On the right track!")
                    alert("On the right track!")
                } else {
                    //console.log("Incorrect :(")
                    alert("Incorrect :(")
                }
            }
        }))
    } else { // display steps in automatic mode
        $("#menu").append($("<div/>", { id: "title", html: `${problemJSON.title} <hr style="border-top: dotted 1px;" />` }))
        $("#menu").append($("<div/>", { id: "points" }))
        $("#menu").append($("<div/>", { id: "problemSet" }))
    }
    problemJSON.holes.forEach((problem, i) => {
        let minStep = getMinStep(problem.expression)
        let parFactor = getParFactor(minStep)
        let par = parseInt(minStep+parFactor)
        let {flagColor, alarm} = getProgressSignal(bestProgress(problem.progress), par, minStep)
        // let flag = $(document.createElementNS("http://www.w3.org/2000/svg", 'svg'))
        // let flag = $("<svg/>", {style:"width:2rem", xmlns:"http://www.w3.org/2000/svg"})
        // .append($("<use/>", {"xlink:href":"images/flag.svg#flag", "style":`--color_fill: ${progress}`}))
        //<br/> par: ${par}
        let problemListItem = `<div class=problemInList> 
        <svg style="width:3.5rem;" viewBox="0 0 208 334">
        <use xlink:href="images/flag.svg#flag" class="flag" id="${i}" style="--color_fill: ${flagColor};"></use>
        </svg>
        <div class="hole-text">  hole ${i + 1} </div>
        </div>`
        let itemEl = Object.assign(document.createElement("div"),{className: "problemList", innerHTML: problemListItem})
        let link = Object.assign(document.createElement("a"),{className: "hole", href: `javascript: window.location.hash = ${i+1}`, style: `grid-column:1; grid-row:${i+1}` })
        link.append(itemEl)
        link.addEventListener("mouseenter", e=> {
            const hoveredHole = e.currentTarget;
            const rect = hoveredHole.getBoundingClientRect();
            const holePosition = {
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX
            };
            const holeWidth = hoveredHole.offsetWidth;
            showProblem(e, problem)
            const problemInfo = document.getElementById('problemInfo');
            if (problemInfo) {
                problemInfo.style.top = `${holePosition.top + 10}px`;
                problemInfo.style.left = `${holePosition.left + holeWidth + 5}px`;
                problemInfo.addEventListener('mouseleave', () => {
                    problemInfo.remove();
                }, { once: true });
            }
        })
        // let link = $("<a/>", { class: "hole", href: `javascript: window.location.hash = ${i+1}`, style: `grid-column:1; grid-row:${i+1}` }).append(problemListItem)
        // .on("mouseenter", function(e) {
        //     const hoveredHole = $(this);
        //     const holePosition = hoveredHole.offset();
        //     const holeWidth = hoveredHole.outerWidth();
        //     showProblem(e, problem)
        //     $("#problemInfo").css({
        //         top: holePosition.top+5,
        //         left: holePosition.left + holeWidth + 5 
        //     }).on("mouseout", function() {
        //         $("#problemInfo").remove();
        //     })})

        // if (flagColor == "white") {$(`#${i}`).parent().parent().parent().addClass("disable")}
    $("#problemSet").append([link])
})
    
    let button = `<img src="images/questionmark.svg" alt="Tour" id="tourButton"></img>`
    $(stage).append(button)
    let problem_id = parseQuery(window.location.search).problem_id
    if (problem_id && problem_id > 10){
        let toolButton = `<img src="images/toolButton.svg" id="toolButton"></img>`
        $(stage).append(toolButton)
        document.body.addEventListener('click', (event) => {
        if (event.target.id === 'toolButton') {
            document.querySelector("#toolDialog")?.remove();
            let properties = { div: [`<img src='images/Syntax${problem_id}.png' id='toolPic'/>`]}
            let dialog = draggableDialog(properties, "toolDialog")
            console.log(problem_id, properties)
            document.querySelector("#sentenceContainer").append(dialog);
            dialog.show();
        }
    });
    }

    // let numberOfTryHoles = problemJSON.holes.length() - $(".disable").length();
    // enableNext();
}

// functions
function enableNext() {
    $(".disable").first().removeClass("disable")
}
// ready function
function loadSentence(sentenceID) {
    let problemJSON = globals.problemJSON;
    document.querySelector("#note")?.remove();
    document.querySelector("#next")?.remove();
    document.querySelector("#dialog")?.remove();
    document.querySelector("#toolDialog")?.remove();
    let bracketedSentence = problemJSON.holes[sentenceID].expression
    if (bracketedSentence) {
        bracketedSentence = bracketedSentence.replaceAll("[", "(").replaceAll("]", ")");
        bracketedSentence = bracketedSentence.replace(/[\r\n]/g, '').replace(/  +/g, ' ');
        bracketedSentence = bracketedSentence.replaceAll(")(", ") (");
        bracketedSentence = bracketedSentence.replaceAll("(Det ", "(det ").replaceAll("(Adj ", "(adj ").replaceAll("(Adv ", "(adv ");
        }
    $("#sentenceContainer").attr("data-currentSentenceID", sentenceID)
    if ($("#sentenceContainer").attr("data-morphologyparts") != undefined) {document.querySelector("#sentenceContainer").removeAttribute("data-morphologyparts")}
    if ($("#sentenceContainer").attr("data-changedword") != undefined) {document.querySelector("#sentenceContainer").removeAttribute("data-changedword")}
    $("#sentenceContainer").attr("data-bracketedSentence", bracketedSentence)
    $("#problemConstituent").attr("data-strokes", 0)
    let minStep = getMinStep(bracketedSentence)
    let parFactor = getParFactor(minStep)
    $("#problemConstituent").attr("data-positivePoint", 0)
    let sentence = bracketToString(bracketedSentence)
    let tempTree = treeToRows(parse(bracketedSentence))
    getNumberOfRows(tempTree)
    // console.log(sentence)
    updatePoints()
    $("#problemConstituent, #lineContainer").html("")
    resizeWindow()
    //foundation = $("#problemConstituent")
    // this causes problems with other functions that use foundation

    // foundation.append($("<div/>").append($("<div/>", {html:"TEST", class: "button"})))
    // setTimeout(x => dragula([document.querySelector('[data-row="0"]')], {copy:true}), 1000)


    // "check answer" button at top, click to generate bracketed syntax to compare and grade
    // if in this mode (manual checking vs automatic checking)
    // use config file?

    // $(foundation).append($("<div/>", { "data-row": 99, class: "container first-row" })) // start with just row 0 div
    // syntax mode or morphology mode
    let selectedMode = undefined;
    if (bracketedSentence.startsWith("(N ") || bracketedSentence.startsWith("(V ") || bracketedSentence.startsWith("(P ") || bracketedSentence.startsWith("(adj ") || bracketedSentence.startsWith("(adv ")) {
        selectedMode = "morphology";
        console.log(selectedMode)
    }
    globals.tree = treeToRows(parse(bracketedSentence))
    makeSelectable(sentence, 0, 0, selectedMode) // this will allow highlighting/selecting, parsing through recursion
    $("#stage").on({
        mousedown: function (e) {
            // console.log($(e))
            const labelList = ["labelDiv", "labelItem", "labelMenu", "typeMenu", "typeItem"]
            $(".selected").removeClass("selected"); // clicking anywhere else deselects
            if (!labelList.some(el => $(e.target).hasClass(el))) { removeMenu() }
            // if ($(e.target).closest("#next, #again").length === 0) {document.querySelector("#dialog")?.remove();}
            // document.querySelector("#toolDialog")?.remove();
            // e.stopPropagation();
            // if ($("#tenseSelect").length){
            //     document.getElementById("tenseSelect").addEventListener('change', ()=>{
            //         ++strokes
            //         constituent = ("-").concat(document.getElementById("tenseSelect").value)
            //         console.log(constituent)
        
            //     }); 
            // } //event listener for change event on created selection box for tense
        }
    })
    let notes = problemJSON.holes[sentenceID].notes
    if (notes != "") {$("#sentenceContainer").append($("<div/>", { id: "note", html: ` Note: ${notes} `}))}
    // document.getElementsByClassName("wordContainer")[0].focus()
    if (bracketedSentence.includes("^")) {
        setUpDrake()
    };
}

function intro() {
    let problemJSON = globals.problemJSON;
    var intro = introJs();
    let dragVideo= "<video src='images/dragVideo.mp4'  autoplay class='introVideo' />"
    let parseVideo= "<video src='images/parseVideo.mp4'  autoplay class='introVideo' />"
    let labelInput = "<video src='images/labelInput.mp4'  autoplay class='introVideo' />"
    let introImage = "<img src='images/intro_final.png'  autoplay class='introPhoto' />"
    intro.setOptions({
        tooltipClass: 'customTooltip',
        steps: [{
            intro: `${introImage}`
        }, {
            element: document.querySelector('#menu'),
            intro: "<h3>Start the Hole</h3>Click the flag to begin a new hole.",
            position: 'right'
        }, {
            element: document.querySelector('#problemSet'),
            intro: `<h3>Track Your Score</h3>Each hole has a "par", meaning a target number of strokes to complete it. <hr/> Finishing a hole under par earns 0 points (red flag). <hr/> Finishing at par earns 1 point (yellow flag). <hr/> A perfect shot earns 2 points (green flag).<hr/> Goal: <br/> To achieve a 100% score, you must earn 2 points for every hole (all green flags).`,
            position: 'right'
        }, {
            element: document.querySelector('#problemConstituent'),
            intro: "<h3>Build Your Tree</h3>This is the green. You will build your tree here.",
            position: 'top'
        }, {
            element: '#row_id_0',
            intro: `<h3>Parse the Sentence</h3>Begin by breaking down the sentence structure. <hr/> ${parseVideo}`,
            position: 'left'
        }, {
            element: '#label_row_0',
            intro: `<h3>Label Constituents</h3>Click on the boxes to assign the labels. <hr/> ${labelInput}`,
            position: 'left'
        }, {
            intro: `<h3>Move Words & Phrases</h3>Click and drag labels to adjust their position in the tree.<hr/> ${dragVideo}`
        }, {
            element: '#tourButton',
            intro: '<h3>Review Instructions</h3>Click this button anytime to revisit these instructions.',
            position:'bottom'
          }]
    })
    intro.oncomplete(function() {
        localStorage.setItem('doneTour', 'yeah!');
      })
    window.addEventListener('load', ()=> {
        var doneTour = localStorage.getItem('doneTour') === 'yeah!';
        if (doneTour) {return console.log("finish")};
        intro.start();
    })
    $("#tourButton").click(function(){
        intro.start();
      });
}

function getTraceInfo(){
    console.log($("#sentenceContainer").attr("data-traceNum"))
    let highestTrace = parseInt($("#sentenceContainer").attr("data-traceNum"))
    let traceInfo = []
    let trace, dest
    let traceNum;
    for (let i = 1; i < highestTrace+1; i++) {
        traceNum = i
        for (rowID in globals.tree) {
            for (columnID in globals.tree[rowID]) {
                let foundTrace = parseInt(globals.tree[rowID][columnID]?.trace)
                if (foundTrace != undefined && foundTrace == traceNum) {
                    trace = {"row":rowID, "info":globals.tree[rowID][columnID]}
                }
                let foundDest = parseInt(globals.tree[rowID][columnID]?.destination)
                if (foundDest != undefined && foundDest == traceNum) {
                    dest = {"row":rowID, "info":globals.tree[rowID][columnID]}
                }
        }}
        if (trace != undefined && dest != undefined) {
            traceInfo.push([trace, dest])
        }
    }
    console.log(traceInfo, globals.tree)
    return traceInfo
}

function makeSelectable(sentence, row, blockIndex, selectionMode=undefined, wrongAnswers = [], different ="") {
    console.log(document.getElementsByClassName(".gu-mirror"))
    if (document.getElementsByClassName(".gu-mirror").length!=0) {
        document.getElementsByClassName(".animateWrong").removeClass("animateWrong")
        console.log("stop selectable feature, it is a drag")
        return
    }
    let bracketedSentence = $("#sentenceContainer").attr("data-bracketedSentence")
    let mode = parseQuery(window.location.search).mode || 'automatic'
    console.log(sentence, row, blockIndex, bracketedSentence, selectionMode, wrongAnswers, different)
    // sentence is a string of words
    // row is the number of the div to put these words into
    // console.log(bracketedSentence, parse(bracketedSentence))
    // index is the position in the row, the initial index of the first word
    console.log(parse(bracketedSentence))
    console.log(treeToString(parse(bracketedSentence)))
    console.log(globals.tree)
    if (!($(`[data-row="${row}"]`)).length) {
        // create row div if it doesn't exist
        let thisRow = globals.tree[row]
        // console.log(thisRow.length, thisRow)
        // let gridColumnStyle = `grid-template-columns: repeat(${thisRow.length}, 1fr);`

        let columnLength = totalColumn(globals.tree)
        let gridColumnStyle = `grid-template-columns: repeat(${columnLength}, 1fr);`
        if (row == 0) {
            gridColumnStyle = ""
        }
        $("#problemConstituent").append($("<div/>", { "data-row": row, class: "container", style:gridColumnStyle }))

        //dragula(document.getElementsByTagName("div"), {copy:true, direction: 'horizontal', slideFactorX: 1, slideFactorY: 1})
        //dragula([...document.getElementsByClassName("container")], {})
    }

    let nextRow = globals.tree[row + 1] || []
    let filterRow = nextRow.filter(n => n.column >= blockIndex && n.column < (blockIndex + sentence.split(" ").length))
    // console.log(blockIndex, filterRow, nextRow, blockIndex + sentence.split(" ").length)
    let modeChange = false
    filterRow.forEach(x => {
        if (x.label == "Af") {
            modeChange = true
        }
        // console.log(x, x.label)
    })
    if (modeChange) {
        selectionMode = "morphology"
        // $(this).attr("data-selectionMode", selectionMode)
    }

    let sentenceArray = [] // will fill with words from sentence then be converted to string
    let traceIndexOffset = 0;
    let af = true
    if (different == "&") {
        af = false
    }
    let asteriskCounter = 0
    sentence.split(' ').forEach((word, index) => {
        let noPad =""
        let fudge = 0
        // if (word == "see")  {
        //     fudge=2
        // }
        console.log(word)
        if ($("#sentenceContainer").attr("data-changedword")) {
            let numberOfRows = $("#menu").attr("data-currentNumberOfRows");
            let changedWord = $("#sentenceContainer").attr("data-changedword")
            changedWord.split(",").forEach(x => {if (x.includes(word)) {changedWord = x}})
            let changedWordSet = changedWord.trim().split("#");
            let changedWordCount = changedWordSet.length;
            console.log(word, changedWordCount, changedWordSet)
            let changedWordIndex = Math.abs(Math.max(changedWordCount-(numberOfRows-row), 0));
            if (word.includes("*")) {
                const subWords = word.split('*');
                let wordUpdated = word 
                subWords.forEach(subWord => {
                    if (changedWordSet.includes(subWord) || subWord == changedWord) {   
                        wordUpdated = wordUpdated.replace(`*${subWord}`, `*${changedWordSet[changedWordIndex]}`).replace(`${subWord}*`, `${changedWordSet[changedWordIndex]}*`).replace(`*${subWord}*`, `*${changedWordSet[changedWordIndex]}*`);
                        sentence = sentence.replace(` ${word} `, ` ${wordUpdated} `);
                        word = wordUpdated
                        console.log(subWord, word, sentence,wordUpdated, changedWordIndex, changedWordSet)
                    }})}
            if (changedWordSet.includes(word)|| word == changedWord ) {
                sentence = sentence.replace(` ${word} `, ` ${changedWordSet[changedWordIndex]} `)
                word = changedWordSet[changedWordIndex]
                console.log(word, sentence, changedWordIndex, changedWordSet)
            }}
        if ($("#sentenceContainer").attr("data-flexAf") && word.includes("|")) {
            let affixIntersect = word.indexOf("|")
            word = word.slice(0, affixIntersect)
        }
        if (word == "") {
            traceIndexOffset -=1;
            return
        }
        if (word.startsWith(`'`) || ($("#sentenceContainer").attr("data-morphologyparts") && $("#sentenceContainer").attr("data-morphologyparts").includes(word)))
            {
                noPad = "noPad"
            }
        if (selectionMode == "morphology") {
            console.log(word)
            noPad = "noPad"
            index+=asteriskCounter
            word.split('').forEach((letter, lIntex) => {
                if (letter == "*") {
                    noPad = ""
                    index += 1
                    console.log(word)
                    asteriskCounter +=1
                    return
                }
                sentenceArray = containerSetUpAndInput(letter, index, traceIndexOffset, fudge, `letterContainer ${noPad}`, sentenceArray)
                console.log(word, sentenceArray)
                noPad = "noPad"
            })
        } else {
            sentenceArray = containerSetUpAndInput(word, index, traceIndexOffset, fudge, `wordContainer ${noPad}`, sentenceArray)}
    })
    const noPadIndex = $("#problemConstituent").attr("data-noPadIndex")
                if (noPadIndex !== undefined) {
                    noPadIndex.split(',').forEach(noPadObject=>{
                        const targetIndex = parseInt(noPadObject)
                        if (sentenceArray[targetIndex]) {sentenceArray[targetIndex].removeClass('noPad');}
                        console.log(sentenceArray)
                    })
                    $("#problemConstituent").removeAttr("data-noPadIndex");
                } 
    let blockElement = [
        (af ? $("<div/>", { class: "labelDiv", id: `label_row_${row}`, html: "?" }).on({
            "click": generateMenu,
        }).css({ "cursor": "pointer" }): $("<div/>", { class: "labelDiv morphoHide"})),
        $("<div/>", { class: "constituentContainer", id:`row_id_${row}` }).append(sentenceArray)]

    if (different == "tenseItem") {
        blockElement = [$("<div/>", { class: "labelDiv", id: `label_row_${row}`, html: "?" }).on({
            "click": generateMenu}).css({ "cursor": "pointer" })]
            // tenseSelection(blockElement) 
            blockElement.push($("<div/>", { class: "tenseItem", html: `[+tns]` }))
            console.log(blockElement)
            blockIndex = parseInt(globals.tree[1][1].column)-1
        } //create selection box for tense
    // put constituent block div in proper row div
    // get unique ID from timestamp
    let blockID = Date.now();
    let traceInclude = globals.tree[row].some(x => {if (x.trace != undefined) {return true}})
    console.log(row, blockIndex, traceInclude)
    if (bracketedSentence.includes("^") && traceInclude) {
        globals.tree[row].some(x => {
            if (x.column!=blockIndex && x.constituent == sentence) {
                console.log(blockIndex, sentenceArray)
                blockIndex+=1
    }})}
    let blockDiv = $("<div/>", { id: blockID, "data-blockindex": blockIndex, "data-selectionMode": selectionMode, class: `block`
        , style:`grid-column:${blockIndex+1} `
        // , style:`grid-column:${blockIndex-row+2} `
        }).on({
        // mousemove: function (e) {
        //     console.log($(this).prev().attr("data-blockindex"), $(this).prev(), $(this))
        //     if ($(this).prev().attr("data-blockindex") == $(this).attr("data-blockindex")){
        //         let newBlockIndex = parseInt($(this).prev().attr("data-blockindex"))+1
        //         $(this).attr("data-blockindex", newBlockIndex)
        //     }
        //     if ($(this).attr("data-blockindex") && !($(this).attr("style").includes(`grid-column: ${parseInt($(this).attr("data-blockindex"))+1}`))) {
        //         $(this).attr("style", `grid-column: ${parseInt($(this).attr("data-blockindex"))+1}`)
        //     }
        // },
        click: function (e) {
            let clickedID = $(this).attr("id")

            let selectedJQ = $(`#${clickedID} .selected`)

            // console.log()

            // var tmp = $("<div/>");
            // tmp.html(selectedJQ);
            // console.log(tmp.html())
            // e.stopPropagation();
            if (selectedJQ.length) {
                let selectedWords = selectedJQ
                // selectedJQ.addClass("faded").removeClass("selected") // appear grey and can't be selected again
                // // once all words in a block are parsed they disappear
                // if(selectedJQ.parent().find(".faded").length == selectedJQ.parent().children().length) {
                //     selectedJQ.parent().addClass("hidden")
                // }
                let trueRow = globals.tree[row + 1]
                let thisRow = globals.tree[row]
                let treeRow = globals.tree
                // console.log(selectedWords, selectionMode, sentence)
                blockIndex = $(`#${blockID}`).attr("data-blockindex") // in case it was updated
                // console.log(selectedJQ, $(`#${blockID}`), selectedWords[0])
                if ($("#sentenceContainer").attr("data-changedword")) {
                    thisRow.some(x => {if (x.changed === sentence) {
                        sentence = x.constituent
                    }})
                }
                let constituent = sentenceArrayToSentence(selectedWords, selectionMode, sentence)
                newIndex = parseInt(blockIndex) + parseInt(selectedWords[0].dataset.index)
                console.log(constituent, blockIndex, newIndex, selectedWords)

                // check if constituent is valid before calling recursion
                // if in automatic checking mode
                if (mode == 'automatic') {
                    let xlabel = ""
                    // parse and give steps if correct
                    console.log(trueRow, newIndex, constituent, treeRow)
                    // console.log(trueRow.some(x => ((x.constituent === constituent))), constituent)
                    // x.constituent === constituent
                    let match = trueRow && trueRow.some((x, i) => {
                        if (((x.constituent === constituent)|| (x.changed === constituent)) && (x.trace == undefined) && (x.column === newIndex)) {
                            xlabel = x.label
                            return true
                        }
                        if (trueRow[i-1] && trueRow[i-1].trace != undefined&&((x.constituent === constituent)|| (x.changed === constituent))) {
                            return true
                        }
                        if (trueRow[i-2] && trueRow[i-2].trace != undefined&&((x.constituent === constituent)|| (x.changed === constituent))) {
                            return trues
                        }
                        if (((x.constituent === constituent)|| (x.changed === constituent)) && (x.trace == undefined) && (x.column === newIndex + (tracePad(row+1, x.column, newIndex, treeRow)))){
                            if ($("#sentenceContainer").attr("data-flexAf")){
                            let flexAfs = $("#sentenceContainer").attr("data-flexAf").split(",")
                            if (constituent == flexAfs[0] ||constituent == flexAfs[1]) {
                                if ((x.constituent === flexAfs[0] || (x.changed === flexAfs[1]))) {
                                    xlabel = x.label
                                    constituent = flexAfs[0]
                                    return true
                                } 
                            } 
                            if (constituent.slice(constituent.length-flexAfs[2].length) == flexAfs[2]) {
                                let noAfConstituent = constituent.substring(0, constituent.length - (flexAfs[2].length+1))
                                console.log(noAfConstituent, constituent)
                                if ((x.constituent === constituent || (x.changed === noAfConstituent))) {
                                    xlabel = x.label
                                    constituent = noAfConstituent
                                    return true
                                } 
                            }}
                            // console.log($(this).children()[1])
                            // $(this).children()[1].attr("data-nextElLabel", x.label)
                         }return false})
                    // console.log(match)
                    if (match
                            //   || x.column === newIndex
                            //   || tracePad(trueRow, x.column, newIndex)
                            ) {
                        console.log(constituent)
                        makeSelectable(constituent, row + 1, newIndex, selectionMode, wrongAnswers, xlabel);
                        selectedJQ.addClass("faded").removeClass("selected")
                        $("#problemConstituent").attr("data-strokes", parseInt($("#problemConstituent").attr("data-strokes"))+1)
                        $("#problemConstituent").attr("data-positivePoint", parseInt($("#problemConstituent").attr("data-positivePoint"))+1)
                    } else {
                        let wrongArray = selectedJQ.toArray().map(item => $(item).attr("data-uid")).join("")

                        if (!wrongAnswers.find((item) => item == wrongArray)) {
                            wrongAnswers.push(wrongArray)
                            // console.log(globals.tree[row + 1])
                            $("#problemConstituent").attr("data-strokes", parseInt($("#problemConstituent").attr("data-strokes"))+1)
                        }
                        selectedJQ.addClass("animateWrong")
                        selectedJQ[0].addEventListener("animationend", (event) => {
                            selectedJQ.removeClass("animateWrong")
                            selectedJQ.removeClass("selected")
                        });

                    }
                    updatePoints()
                    //console.log(points)


                } else {
                    makeSelectable(constituent, row + 1, newIndex, selectionMode, wrongAnswers);
                    selectedJQ.addClass("faded").removeClass("selected") // appear grey and can't be selected again

                }

                // once all words in a block are parsed they disappear
                // if(selectedJQ.parent().find(".faded").length == selectedJQ.parent().children().length) {
                //     selectedJQ.parent().addClass("hidden")
                // }                    
                //resizeWindow()
                // redraw SVG based on new child
                // drawLines();
                // $("div:contains('s)").css({"padding-left":0})
                resizeWindow()
            }
        }

    }).append(blockElement)
    
    // dragula([...document.getElementsByClassName("container")], {
    //     moves: function (el, container, handle) {
    //         //console.log("move")
    //         return handle.classList.contains('labelDiv');
    //         }
    // });

    // testing drawing
    //drawDot(blockDiv)

    // actually put the constituent on the page
    // prepend to first div whose index is greater

    let rowJQ = $(`[data-row="${row}"]`)

    if (rowJQ.children().length) {
        let greatest = true
        rowJQ.children().each(function (item) {
            if (blockIndex < $(this)[0].dataset.blockindex) {
                blockDiv.insertBefore($(this))
                greatest = false
                return false
            }
            if (greatest) {
                rowJQ.append(blockDiv)
            }
        })
    } else {
        rowJQ.append(blockDiv)
    }
    // document.querySelector(".noPad"):has()
    // $(".noPad").prev().style.paddingRight="0em !important";
    // console.log(rowJQ.children().first())
    // let firstItem = rowJQ.children().first()
    // let firstIndex = firstItem.attr("data-index")
    // rowJQ.children().css({"padding-left":0})
    // firstItem.css({"padding-left":`${firstIndex * 10}rem`})

    //leftPad(rowJQ)
    // leftPadAll()
    // console.log($(".noPad").prev().html())
    
}

function totalColumn(nodeSentence) {
    let totalColumn = 0
    nodeSentence.forEach(x=> {
        x.forEach(y => {
            if (y.column > totalColumn) {
                totalColumn = y.column
                console.log(totalColumn)
            }
        })
    })
    return totalColumn +1;
}

["hashchange" ].forEach( event=>addEventListener(event,hashLoadSentence))

function hashLoadSentence() {
    let sentenceID = parseInt(location.hash.split("#")[1])-1 || 0
    if (localStorage.getItem('loaded')==null) {
        localStorage.setItem('loaded', '1');
        location.reload()
    } else {
        setTimeout(() => {
            localStorage.removeItem('loaded')
        }, 500);
    }
    loadSentence(sentenceID)
}


function selected(el) {
    let thisBlockID = $(el).parent().parent().attr("id")
    let allSelected = $('.selected')
    // && $("#sentenceContainer").attr("data-morphologyparts")==undefined
    // if (allSelected.length) {
    //     let firstSelected = $(allSelected[0])[0]
    //     let lastSelected = $(allSelected.slice(-1))[0]
    //     for (i = 0; i < $(el).parent().length; i++) {
    //         console.log(firstSelected[0], lastSelected)
    //         if (firstSelected != lastSelected) {
    //             firstSelected = firstSelected.nextElementSibling
    //             console.log(firstSelected)
    //         }
    //     }
    //     selectedID = $($(".selected")[0]).parent().parent().attr("id")
    //     if (thisBlockID != selectedID) {
    //         return
    //     }

    // }
    // if (allSelected.length && ($("#sentenceContainer").attr("data-bracketedsentence").startsWith("(S ") || $("#sentenceContainer").attr("data-bracketedsentence").startsWith("(TP ")|| $("#sentenceContainer").attr("data-bracketedsentence").startsWith("(CP "))) {
    //     let firstSelected = $(allSelected[0]).attr("data-index")
    //     let lastSelected = $(allSelected.slice(-1)).attr("data-index")
    //     for (i = firstSelected; i < lastSelected; i++) {
    //         $(allSelected[0]).parent().find("[data-index").each(function () {
    //             if ($(this).attr("data-index") == i) { $(this).addClass("selected") }
    //         })
    //     }
    //     selectedID = $($(".selected")[0]).parent().parent().attr("id")
    //     if (thisBlockID != selectedID) {
    //         return
    //     }

    // } else 
    if (allSelected.length){
        let leftFirst = allSelected[0].getBoundingClientRect().left;
        let leftLast = allSelected.slice(-1)[0].getBoundingClientRect().left
        $(allSelected[0]).parent().find("[data-index]").each(function () {
            let leftObject = this.getBoundingClientRect().left
            if (leftObject >= leftFirst && leftObject <= leftLast) { 
            $(this).addClass("selected");
        }})
        selectedID = $($(".selected")[0]).parent().parent().attr("id")
        if (thisBlockID != selectedID) {
            return
        }
    }
    if (!$(el).hasClass("faded")) {
        $(el).addClass("selected"); // highlights in turquoise
    }
}

function sentenceArrayToSentence(sentenceArray, selectionMode, sentence) {
    if (selectionMode == "morphology") {
        let targetElementIndex = []
        sentenceArray.each(function(index, element) {
            if (!$(element).hasClass('noPad')) {
                console.log(index)
                targetElementIndex.push(index);
              }});
        if (targetElementIndex != []) {$("#problemConstituent").attr("data-noPadIndex", targetElementIndex)}
        let selectedWord = $.makeArray(sentenceArray).map(wordDiv => wordDiv.innerHTML).join("");
        let comparedWord = []
        sentence.split(/[ *]+/).forEach((word) => {
            console.log(sentenceArray, sentence, word, selectedWord)
            let preWord = word;
            let changedWord = word;
            if (word.includes("#")){
                preWord = word.substr(0,word.indexOf("#"))
                changedWord = word.substr(word.indexOf("#")+1)
                console.log(preWord,changedWord)
            }
            if (preWord == selectedWord.substr(0, preWord.length)) {
                word = preWord
            } else if (changedWord == selectedWord.substr(0, changedWord.length)) {
                word = changedWord
            } else {return}
                comparedWord.push(word)
                selectedWord = selectedWord.substr(word.length)
                console.log(comparedWord)
        })
        comparedWord.push(selectedWord)
        // console.log(comparedWord, comparedWord.join(" "), sentenceArray, selectedWord)
        return comparedWord.join(" ").replace(/ $/g, '');
    }
    return $.makeArray(sentenceArray).map(wordDiv => wordDiv.innerHTML).join(" ");
}

function containerSetUpAndInput(text, index, traceIndexOffset, fudge, className, sentenceArray) {
    if (text.includes("+")) {
        return sentenceArray
    }
    // console.log(text, index,traceIndexOffset, fudge, className, sentenceArray)
    let container =  $("<div/>", { role:"checkbox","aria-checked":"false",html: text, "data-uid": Math.random(), "data-index": index+traceIndexOffset+fudge, class: className })
                .on({
        
                    mousemove: function (e) {
                        if (e.buttons == 1) {
                            selected(this)
                        }
                    },
        
                    // for mobile compatibility
        
                    "touching": function (e) {
                        selected(this)
                    },
        
                    "touchmove": function (e) {
                        let elem = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
                        $(elem).trigger("touching")
                    }
                });
                sentenceArray.push(container)
    return sentenceArray;
}

function labelEmptyGridColumns(gridContainer) {
    const gridChildren = Array.from(gridContainer.children);
    console.log(gridContainer, gridChildren)
    // Determine the maximum grid-column value
    const columnValues = gridChildren.map(child => 
        parseInt(getComputedStyle(child).gridColumnStart, 10)
    );
    const maxColumn = Math.max(...columnValues);

    // Loop through each column in the grid
    for (let i = 1; i <= maxColumn; i++) {
        const isEmpty = !gridChildren.some(child => 
            parseInt(getComputedStyle(child).gridColumnStart, 10) === i
        );

        if (isEmpty) {
            // Add a label or marker for empty columns
            const label = document.createElement('div');
            label.className = 'empty-column-label';
            label.style.gridColumn = i;
            gridContainer.appendChild(label);
        }
    }
}

function drawLines() {
    // resizeWindow()

    // clear current SVG
    $("#lineContainer").empty()

    // go through parent child pairs and draw all lines between them

    let callback = function (block) {
        let parent = findParent($(this))
        drawLine($(this), parent)
    }
    traverse(callback)

    // also draw arrows between traces and copies
    drawArrows()

}

function traverse(callback) {
    $("#problemConstituent").children().not('.gu-transit, .gu-mirror').each(function (row) {
        let rowThis = $(this)
        let rowIndex = parseInt(rowThis.attr("data-row"))
        if (rowIndex > 0) { // skip root node           
            rowThis.children().each(callback)
        }
    })
}

function setUpDrake() {
    let mode = parseQuery(window.location.search).mode || 'automatic'
    let traceInfo = getTraceInfo()
    let traceNum = traceInfo.length
    // if (drake) {drake.destroy();}
    let drake
    drake = dragula([...document.getElementsByClassName("container")], {
        isContainer: function (el) {
            let showDropHint = !($(el).attr("data-row") == "0") && $(el).hasClass("container") 
            console.log(showDropHint)
            return showDropHint;
            // if ($(el).attr("data-row") == "0") {
            //     return false
            // }
            // if ($(el).hasClass("container")) {
            //     return true
            // } else {
            //     return false
            // }

        },
        moves: function (el, container, handle) {
            //console.log("move")
            $(el).attr("data-showme", true)
            const handleHasClass = handle.classList.contains('labelDiv');
            const elementIsTraced = $(el).hasClass("traced");
            console.log({
                "Element you want to drag": el,
                "The specific part you clicked": handle,
                "Does the clicked part have 'labelDiv' class?": handleHasClass,
                "Does the element already have 'traced' class?": elementIsTraced,
                "FINAL DECISION (will drag start?)": handleHasClass && !elementIsTraced
              });
            return (handle.classList.contains('labelDiv') && !($(el).hasClass("traced")));
        },
        copy: true
    });
    let lastDropPosition = { x: 0, y: 0 };
    const updateLastPosition = (event) => {
        lastDropPosition.x = event.clientX;
        lastDropPosition.y = event.clientY;
        const transitEl = document.querySelector('.gu-transit');
    if (!transitEl) return;

    const container = transitEl.parentElement; // The .container grid
    if (!container) return;

    // 1. Get all actual grid items (ignore Dragula's transit and mirror elements)
    const items = Array.from(container.children).filter(child => 
        !child.classList.contains('gu-transit') && 
        !child.classList.contains('gu-mirror')
    );

    if (items.length === 0) return;

    let targetGridColumn = 1;
    let found = false;

    // 2. Loop through items to see which one the mouse is currently hovering over
    for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        let nextExist = false;
        let rectNext;
        console.log(items[i])
        if (i != items.length-1) {
            nextExist = true
            rectNext = items[i+1].getBoundingClientRect();
        }
        console.log(items[i])
        const rectColumn = items[i].style.gridColumn
        
        // If the mouse X is within the left and right edges of this item
        if ((nextExist && lastDropPosition.x >= rect.left&& lastDropPosition.x <= rectNext.left) || 
            (!nextExist && lastDropPosition.x >= rect.left)) {
            targetGridColumn = parseInt(rectColumn) + 1; // CSS Grid is 1-indexed
            found = true;
            break;
        } else {
            targetGridColumn = 1;
        }
    }

    // 3. If the mouse isn't over an item, check if it's on the far right side
    if (!found) {
        const lastItemRect = items[items.length - 1].getBoundingClientRect();
        const lastRectColumn = items[items.length - 1].style.gridColumn
        if (lastDropPosition.x > lastItemRect.right) {
            // Put it in the next empty column after the last item
            targetGridColumn = parseInt(lastRectColumn) + 1; 
        } else if (lastDropPosition.x < items[0].getBoundingClientRect().left) {
            // Or if it's on the far left side
            targetGridColumn =1;
            
        }
    }

    // 4. Force the transit background into the correct column
    transitEl.style.gridColumn = targetGridColumn;
    };
    // drake.on("out",resizeWindow)
    // drake.on("shadow",resizeWindow)
    drake.on("drag", (el, source)=> {
        console.log(el, el.id, source) 
        $(".animateWrong").removeClass("animateWrong")
        $(el).removeClass("animateWrong")
        let row = $(source).attr("data-row")
        let column = parseInt($(el).attr("data-blockindex"))
        for (let i=0; i< traceNum; i++) {
            console.log(traceInfo[i][1]["row"], row, traceInfo[i][1]["info"].column, column)
            if (traceInfo[i][1]["row"] == row && traceInfo[i][1]["info"].column==column) {
                console.log(i+1)
                $(el).attr("data-dest", i+1)
            }
        }
        if ($(el).attr("data-dest")) {
            traceNum = parseInt($(el).attr("data-dest"))-1 ||0
        } else {
            traceNum = "non"
        }
        document.addEventListener('mousemove', updateLastPosition);
        // if (target) {labelEmptyGridColumns(target)}
    })
    drake.on("drop", (el, target, source, sibling) => {//resizeWindow()
        $(el).removeClass("animateWrong")
        $(".animateWrong").removeClass("animateWrong")
        console.log({el, target, source, sibling})
        console.log(traceNum, $(target).attr("data-row"))
        if (traceNum == "non") {
            $(el).remove()
            traceNum = traceInfo.length;
            return
        }
        let targetRow = parseInt(traceInfo[traceNum][0]["row"])
        let targetColumn = parseInt(traceInfo[traceNum][0]["info"].column)
        // if (target === null || targetRow != parseInt($(target).attr("data-row"))) { // dropped back where it originated
        if (target === null) {
            console.log("no movement")
            $(el).remove()
            return
        } else {
            let rowOfTarget = target.attributes["data-row"].value
            // $(".gu-mirror").remove()
            console.log(traceInfo, traceNum, targetRow, targetColumn, rowOfTarget)
            if (rowOfTarget != targetRow) {
                console.log("target no right")
                $(el).remove()
                return
            }
        }
        
        console.log($(target)[0].childNodes)
        let destID = $(el).attr("id")
        console.log(destID)
        $(el).attr("id", Date.now()) // new distinct id
        let index = $(`[data-wastraced]`).length + 1
        $(`#${destID}`).attr("data-destination", index)
        $(el).attr("data-wastraced", index)
        let leftEL = lastDropPosition.x
        let nextEL = "none"
        for (const child of target.childNodes) {
            if (child.nodeType === Node.ELEMENT_NODE && $(child).attr("data-wastraced")==undefined) {
                let leftX = child.getBoundingClientRect().left;
                console.log(child, leftEL, leftX, el)
                if (leftX > leftEL) {
                    console.log(child, leftEL, leftX, el)
                    nextEL = child; 
                    break;          
                }
            }
        }
        //console.log($(el).prev().attr("data-blockindex"))
        // updating block index
        let newBlockIndex = $(el).attr("data-blockindex")
        // console.log($(el).next(), $(el).prev())
        // $('.empty-column-label').remove()
        console.log(nextEL)
        if (nextEL!= "none") {
            console.log('next exist');
            newBlockIndex = parseInt($(nextEL).attr("data-blockindex"))-1
        } else {
            console.log("no next")
            let targetRow = $(target).attr("data-row")
            let lastChildNode;
            lastChildNode = $(target)[0].childNodes[$(target)[0].childNodes.length-2]
            let officalLast;
            console.log(target, targetRow, lastChildNode)
            if (lastChildNode) {
                let lastChildBlock = $(lastChildNode).attr("data-blockindex")
                officalLast = globals.tree[targetRow].filter(x => x.column == lastChildBlock)[0]
                console.log($(target), globals.tree[targetRow], lastChildNode, lastChildBlock, officalLast)
                if (officalLast && officalLast.trace ==undefined) {
                    console.log(officalLast.constituent.split(" "))
                    newBlockIndex = parseInt(officalLast.column) + officalLast.constituent.split(" ").length;
                    console.log(lastChildNode, newBlockIndex)
                }
            }
        }
        // console.log(newBlockIndex, $(el))
        $(el).attr("data-blockindex", newBlockIndex)
        // console.log($(el).attr("data-blockindex")) 
        //console.log(findParent($(el)))
        document.removeEventListener('mousemove', updateLastPosition);
        // console.log(getTraceInfo(el, target))
        // test if this placement is valid for automatic mode
        if (mode == 'automatic') {
            newBlockIndex = parseInt($(el).attr("data-blockindex")) //update blockIndex
            // $("#problemConstituent").attr("data-strokes", parseInt($("#problemConstituent").attr("data-strokes"))+1)
            // console.log(globals.tree)
            // trueRow.some(x => ((x.constituent === constituent)
            // && (x.column === newBlockIndex || tracePad(trueRow, x.column, newBlockIndex))
            // && 
            if (targetColumn==newBlockIndex) {
                if (nextEL!= "none") {
                    target.insertBefore(el, nextEL);
                }
                $(el).attr("style", `grid-column: ${newBlockIndex+1}`)
                console.log(el)
                $(el).attr("data-traceindex", traceNum+1)
                // $(el).next().attr("style", `grid-column: ${newBlockIndex+2}`)
                // updateIndicesAfterTrace(el)
                $("#problemConstituent").attr("data-strokes", parseInt($("#problemConstituent").attr("data-strokes"))+1)
                $("#problemConstituent").attr("data-positivePoint", parseInt($("#problemConstituent").attr("data-positivePoint"))+1)
                if (!(traceInfo.destination)){
                    $(el).addClass("traced")
                }
                $(`#${destID}`).addClass("traced")
                console.log($(`#${destID}`),$(el)[0],traceInfo)
                drawArrows()
            } else {
                $(el).remove()
            }
            updatePoints()
            // finishAlarm()
        }
        $(el).find(".labelDiv").text("?").css({ "cursor": "pointer" }).on({
            "click": generateMenu
        })

        // leftPad($(target))
        // drawLines()
        requestAnimationFrame(()=> {resizeWindow()}) //wait until previous program finished
        return true }
    )
}

function findParent(block) {
    // row is row before row of block, look there for parent
    let parent = false
    rowIndex = parseInt(block.parent().attr("data-row"))
    row = $(`[data-row="${rowIndex - 1}"]`)
    // console.log(row)
    indexVarificator = parseInt($(block).attr("data-blockindex"))
    let maxBlock =row.children().not('.gu-transit, .gu-mirror')
    row.children().not('.gu-transit, .gu-mirror').each(function () {
        // console.log($(this), $(this).attr("data-blockindex"))
        // console.log($(block), $(block).attr("data-blockindex"), $(block)[0].dataset.blockindex)
        // console.log($(this))
        if ($(this).attr("data-traceindex") && $(block).attr("data-wastraced")) {
            // indexVarificator += 1
            console.log(indexVarificator)
        }
        if ($(this).attr("data-blockindex") > indexVarificator) {
            return false
        }
        if ($(this).attr("data-blockindex") > maxBlock.attr("data-blockindex")) {
            maxBlock=$(this)
        }
    })
    parent = maxBlock
    console.log(parent, block, indexVarificator, maxBlock)
    return parent
}

function drawLine(child, parent) {
    let topElement = parent.find(".constituentContainer");
    let parentLabel = parent.find(".labelDiv");
    let childLabel = child.find(".labelDiv");

    // We'll use pixel offsets instead of percentages
    let pixelOffset = 10; // Adjust this number (in pixels) to match your old percentage offset
    let needsOffset = 0;

    if (parent.find(".constituentContainer").hasClass("hidden")) {
        topElement = parentLabel;
        needsOffset = 1;
    }

    // 1. Get the exact bounding boxes of the elements and the SVG container
    let pRect = topElement[0].getBoundingClientRect();
    let cRect = childLabel[0].getBoundingClientRect();
    let svgRect = document.getElementById("lineContainer").getBoundingClientRect();

    // 2. Calculate X and Y in exact pixels relative to the SVG container's top-left corner
    
    // Parent X (Center) and Y (Bottom)
    let pCenterX = (pRect.left + (pRect.width / 2)) - svgRect.left;
    let pBottomY = (pRect.bottom) - svgRect.top;

    // Child X (Center) and Y (Top)
    let cCenterX = (cRect.left + (cRect.width / 2)) - svgRect.left;
    let cTopY = (cRect.top) - svgRect.top+6;

    // Apply offsets
    pBottomY = pBottomY + (pixelOffset * needsOffset);
    cTopY = cTopY - pixelOffset;

    // 3. Draw the line using absolute pixel coordinates
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    $("#lineContainer").append(line);
    
    $(line).attr({ 
        x1: pCenterX, 
        y1: pBottomY, 
        x2: cCenterX, 
        y2: cTopY, 
        class: "branch" 
    });
}

function drawDot(elem) {
    let containerWidth = $("#lineContainer").width()
    let containerHeight = $("#lineContainer").height()
    let [left, top, right, bottom] = getCorners(elem)
    //console.log({left, top, right, bottom})
    //console.log(left)
    let centerX = (left + right) / 2
    let centerY = (top + bottom) / 2
    let centerXPercent = centerX / containerWidth * 100
    let centerYPercent = centerY / containerHeight * 100

    let word = elem[0].innerHTML

    var shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $("#lineContainer").append(shape);
    $(shape).attr({ cx: `${centerXPercent}%`, cy: `${centerYPercent}%`, r: "1%", "data-word": word });

    // testing putting dots in upper left and bottom right
    let leftPercent = left / containerWidth * 100
    //console.log(leftPercent, left, containerWidth)
    let topPercent = top / containerHeight * 100
    var shape2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $("#lineContainer").append(shape2);
    $(shape2).attr({ cx: `${leftPercent}%`, cy: `${topPercent}%`, r: "1%", "data-word": word, fill: "green" });

    let rightPercent = right / containerWidth * 100
    let bottomPercent = bottom / containerHeight * 100
    var shape3 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $("#lineContainer").append(shape3);
    $(shape3).attr({ cx: `${rightPercent}%`, cy: `${bottomPercent}%`, r: "1%", "data-word": word, fill: "red" });

    // put dots where start and end of lines would be
    // x center, y bottom and x center, y top
    var shape4 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $("#lineContainer").append(shape4);
    $(shape4).attr({ cx: `${centerXPercent}%`, cy: `${bottomPercent}%`, r: "1%", "data-word": word, fill: "blue" });
    var shape5 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $("#lineContainer").append(shape5);
    $(shape5).attr({ cx: `${centerXPercent}%`, cy: `${topPercent}%`, r: "1%", "data-word": word, fill: "yellow" });

    // center black, upper left green, bottom right red, bottom center blue, top center yellow


}

function getCorners(elem) {
    // console.log(elem)
    let width = elem[0].offsetWidth
    let height = elem[0].offsetHeight
    let top = elem.position().top
    let left = elem.position().left
    let right = left + width
    let bottom = top + height
    let centerX = (left + right) / 2
    let centerY = (top + bottom) / 2

    //return Object.values({left, top, right, bottom})
    // console.log(elem, { left, top, right, bottom, centerX, centerY })
    return [left, top, right, bottom, centerX, centerY]
}

function generateMenu(e) {
    let mode = parseQuery(window.location.search).mode || 'automatic'
    let bracketedSentence = $("#sentenceContainer").attr("data-bracketedSentence")
    // let clickedOnQuestion = $(e.target).hasClass("labelDiv")
    if ($(e.target).text() != "?") { return }
    // if(!clickedOnQuestion) {return}
    // if ($(e.target)){return false}
    if ($(".labelMenu").length) {
        return;
    }
    // console.log($(this))
    // console.log($(this).parent())
    // console.log($(this).parent().find(".constituentContainer").find(".letterContainer"))
    // console.log($(this).parent().find(".constituentContainer").find(".wordContainer").toArray().map((wordContainer)=>{return wordContainer.innerHTML}).join(" "))
    let constituent = $(this).parent().find(".constituentContainer").find(".wordContainer").toArray().map((wordContainer) => { return wordContainer.innerHTML }).join(" ")
    //console.log(constituent)
    // console.log($(this).parent().parent().attr("data-row"))
    let row = parseInt($(this).parent().parent().attr("data-row"))
    // console.log($(this).parent().parent())
    // //console.log($(this).parent().attr("data-blockindex"))
    let column = parseInt($(this).parent().attr("data-blockindex"))
    let treeRow = globals.tree
    let filterForTense = treeRow[row].find(item => item.constituent.includes("+"))
    if (filterForTense) {
        filterForTense.constituent = filterForTense.constituent.replace(/ +(\w+)/g, "")
        console.log(filterForTense)
    }
    let reference = treeRow[row].find(item => item.constituent.replace(/\s/g, '') === constituent.replace(/\s/g, '') && item.column === column + (tracePad(row+1, item.column, column, treeRow)))
    if ($(this).parent().find(".constituentContainer").find(".letterContainer").length) {
        constituent = $(this).parent().find(".constituentContainer").find(".letterContainer").toArray().map((letterContainer) => { return letterContainer.innerHTML }).join("")
        reference = treeRow[row].find(item => (item.constituent.replace(/\s/g, '') === constituent || item.changed === constituent) && item.column === column + (tracePad(row+1, item.column, column, treeRow)))
        console.log(reference, treeRow, constituent)
    }
        // only used in auto mode
    //+ (tracePad(row, item.column, column, treeRow))
    // item.constituent === constituent & 
    let correctLabel = reference?.label
    console.log(reference, correctLabel, constituent, column, treeRow[row])

    $(this).css({ "cursor": "auto"})
    let labelArrayID = 0;
    if (bracketedSentence.includes("(Aux ")) {
        labelArrayID = 1
    }
    let labels = [
    ["N", "V", "P", "adj", "adv", "det", "T", "S","D", "A", "deg", "C"],
    ["N", "V", "P", "adj", "adv", "det", "T", "S", "deg", "D", "C", "A", "Perf", "Prog", "Conj"],
    ["N", "V", "P", "adj", "adv", "Af"]
    ]
    let labelFilterSet = [{"phrase": ["S", "adj", "adv","det", "deg"], "non" : [], "bar": ["N", "V", "P","T", "adj", "adv", "det", "S", "deg", "PossN", "A"]}, 
    {"phrase": ["S", "adj", "adv","det", "deg"], "non" : ["Aux"], "bar": ["N", "V", "P", "T", "adj", "adv", "det", "S", "deg", "D", "A"]}]

    let labelFilterByCourse = [{"6":[],"7":[],"8":[],
    "14":["adv", "deg", "C", "T", "P", "D", "A"],
    "15":["adv","deg", "C", "T", "D", "A"],
    "16":["adv","deg", "det", "C", "T", "A"],
    "17":["adv","deg", "det", "C", "T", "A"],
    "18":["adv", "adj", "det", "C", "T"],
    "19":["adv", "adj", "det", "C", "S"],
    "20":["adv", "adj", "det", "S"],"21":["adv", "adj", "det", "S"]}, {}]

    let symbolMap = { "'": "bar", "P": "phrase"}
        // "P's": "possPhrase"}

    let typeMenu = $("<div/>", { class: "typeMenu" }).append(
            [$("<div/>", { class: "typeItem", html: "P", style: "float:right;" })])

    let labelDivArray = []
    if ($("#sentenceContainer").attr("data-bracketedSentence").includes("' ")) {
        typeMenu = $("<div/>", { class: "typeMenu" }).append(
            [$("<div/>", { class: "typeItem", html: "'" }), $("<div/>", { class: "typeItem", html: "P" })])
    }

    if ($(this).parent().attr("data-selectionMode") == "morphology") {
        labelArrayID = 2
        typeMenu = "<br/>"
    }

    for (i of labels[labelArrayID]) {
        labelDivArray.push($("<div/>", { html: i, class: "labelItem" }))
    }

    $(this).append($("<div/>", { class: "labelMenu" }).append([...labelDivArray, typeMenu]))
    let courseNum = parseQuery(window.location.search).problem_id || 7
    if (labelArrayID != 2) {
        let filterArrayMerge = labelFilterSet[labelArrayID]["non"].concat(labelFilterByCourse[labelArrayID][courseNum])
        labelFilters($(`.labelItem`), filterArrayMerge, "non")
        // let allowedLabels = getSafeLabels(bracketedSentence, courseNum)
        // $(".labelItem").each(function() {
        //     if (!allowedLabels.has($(this).text())) {
        //         $(this).addClass("hide")
        //     }
        // })
    }

    // drawLines()
    resizeWindow()

    $(this).find(".typeItem").on({
        "click": function (e) {
            let labelHTML = $(this).html()
            for (symbol of Object.keys(symbolMap)) {
                // console.log(symbol, labelHTML)
                if (symbol != labelHTML) {
                    $(this).parent().parent().find(".labelItem").removeClass(symbolMap[symbol]).removeClass("possPhrase")
                    filterArrayMerge = labelFilterSet[labelArrayID]["non"].concat(labelFilterByCourse[labelArrayID][courseNum])
                    labelFilters($(`.labelItem`), filterArrayMerge, "non");
                }
            }
            let typedLabel = $(".labelItem")
            if (labelHTML == "P") {
                typedLabel = $(".labelItem").filter(el => ($(".labelItem")[el].innerHTML != ("Aux"))) //no add P after Aux
                // if (!labelFilterByCourse[labelArrayID][courseNum]?.includes("PossN")) {
                //     let PossObject = $(".labelItem").filter(el => ($(".labelItem")[el].innerHTML == ("PossN")))
                //     typedLabel.push(PossObject) 
                //     PossObject.toggleClass(symbolMap["P's"])} //add not only P but add P's to PossN
            }
            typedLabel.toggleClass(symbolMap[labelHTML])
            if ($(`.${symbolMap[labelHTML]}`).length) {
                filterArrayMerge = labelFilterSet[labelArrayID][symbolMap[labelHTML]].concat(labelFilterByCourse[labelArrayID][courseNum])
                labelFilters($(`.${symbolMap[labelHTML]}`), filterArrayMerge, symbolMap[labelHTML]);
                
                // let structuralFilters = labelFilterSet[labelArrayID][symbolMap[labelHTML]] || []
                // let allowedLabels = getSafeLabels(bracketedSentence, courseNum)
                
                // $(".labelItem").each(function() {
                //     let label = $(this).text()
                //     let shouldHide = false
                    
                //     if (!allowedLabels.has(label)) shouldHide = true
                //     if (structuralFilters.includes(label)) shouldHide = true
                    
                //     if (shouldHide) $(this).addClass("hide")
                //     else $(this).removeClass("hide")
                // })
            } else {
                filterArrayMerge = labelFilterSet[labelArrayID]["non"].concat(labelFilterByCourse[labelArrayID][courseNum])
                labelFilters($(`.labelItem`), filterArrayMerge, "non");
                //  let structuralFilters = labelFilterSet[labelArrayID]["non"] || []
                //  let allowedLabels = getSafeLabels(bracketedSentence, courseNum)
                 
                //  $(".labelItem").each(function() {
                //     let label = $(this).text()
                //     let shouldHide = false
                //     if (!allowedLabels.has(label)) shouldHide = true
                //     if (structuralFilters.includes(label)) shouldHide = true
                //     if (shouldHide) $(this).addClass("hide")
                //     else $(this).removeClass("hide")
                // })
            }
        }
    })

    $(".labelItem").on({
        "click": function (e) {
            let classes = new Set($(this).attr("class").split(" "))
            let types = new Set(Object.values(symbolMap))
            let intersect = [...classes].filter(i => types.has(i))[0] || ""
            let symbol = inverse(symbolMap)[intersect] || ""
            let label = $(this).html() + symbol
            console.log(label)
            // replace ? with label and close menu
            $("#problemConstituent").attr("data-strokes", parseInt($("#problemConstituent").attr("data-strokes"))+1)
            console.log(label,correctLabel)
            if (correctLabel == undefined) {correctLabel = "T"}
            if ((mode == 'manual') || (mode == 'automatic' && label == correctLabel)) {
                if (treeRow[row+1] && $("#sentenceContainer").attr("data-bracketedsentence").includes("+") && (correctLabel == "S" || correctLabel == "TP")) {
                    makeSelectable("", row+1, 1, "syntax",[], "tenseItem")
                } //creating selection box for tense like -past
                removeMenu($(this).parent().parent(), label)
                $("#problemConstituent").attr("data-positivePoint", parseInt($("#problemConstituent").attr("data-positivePoint"))+1)
                finishAlarm()
            } else {
                $(this).parent().parent().addClass("animateWrong")
                $(this).parent().parent()[0].addEventListener("animationend", (event) => {
                    $(this).parent().parent().removeClass("animateWrong")
                    $(this).parent().parent().removeClass("selected")
                });
            }
            updatePoints()
            //console.log(points)


        }
    })

}

function labelFilters(labelDiv, filterArray, status){
    $(".hide").removeClass("hide")
    if (status == "non") {$(".labelItem").filter(el => ($(".labelItem")[el].innerHTML == ("PossN"))).removeClass("possPhrase")}
    if (filterArray) {
    labelDiv.filter(x => {filterArray.forEach(y =>
        { 
            if (y == labelDiv[x].innerHTML){
            $(labelDiv[x]).addClass("hide")
        }
        })})} 
}

function tenseSelection(tenseElement) {
    var select = Object.assign(document.createElement("select"),{id:"tenseSelect", innerHTML:"Select for tense"});
    let optionSet = ["+present", "+past", "∅"]
    optionSet.forEach(x => {
        let option = Object.assign(document.createElement("option"),{innerHTML:`${x}`, class: "tense"})
        select.appendChild(option);
    })
    console.log(select)
    tenseElement.push(select)
}
 
function removeMenu(labelItem = $(".labelDiv"), label = "?") {
    // labelItem.css({ "width": "1.5em" })
    labelItem.removeAttr("style")
    if (label != "?") {
        labelItem.text(label)
    }
    $('.labelMenu').remove()
    // $(this).parent().remove() // cannot be reopened due to .one({}) // redundant?
    // $(this).parent().parent()
    // drawLines()
    resizeWindow()
}

function inverse(obj) {
    var retobj = {};
    for (var key in obj) {
        retobj[obj[key]] = key;
    }
    return retobj;
}

function getTree() {
    // when player clicks "done" 
    // get bracketed syntax representation of final syntax tree to compare to official answer

    // maps block IDs to list of IDs of its children
    let parentChildrenMap = getParentChildrenMap()

    // ID of block containing original sentence
    let root = $(`[data-row="0"]`).children()[0].id

    let tree = treeAtNode(root, parentChildrenMap)

    return tree
}

function getParentChildrenMap() {
    let PCM = {}
    let callback = function (block) {
        let childID = $(this).attr("id")
        let parent = findParent($(this))
        //console.log(parent)
        if (parent) {
            let parentID = findParent($(this)).attr("id")
            if (!(parentID in PCM)) {
                PCM[parentID] = []
            }
            PCM[parentID].push(childID)
        } else {
            //console.log("Error: parent does not exist")
        }

    }
    traverse(callback)

    return PCM
}

function treeAtNode(blockID, PCM) {
    let node = $(`#${blockID}`)
    let label = node.find(".labelDiv").text()

    // base case: child is not a parent and therefore is a leaf
    if (!(blockID in PCM)) {
        let word = node.find(".constituentContainer").find(".wordContainer").toArray().map((wordContainer) => { return wordContainer.innerHTML }).join(" ")
        let leaf = `(${label} ${word})`
        //console.log(leaf)

        // if there's an attribute indicating that the word is a trace or destination, include ^ti or ^i
        //console.log(node.attr("data-wastraced"), node.attr("data-destination"))
        if (node.attr("data-wastraced")) {
            leaf = leaf.replace(")", ` ^t${node.attr("data-wastraced")})`)
        }
        // allow for multiple movements? 
        if (node.attr("data-destination")) {
            leaf = leaf.replace(")", ` ^${node.attr("data-destination")})`)
        }
        //console.log(leaf)

        return leaf
    } else {
        let childrenIDs = PCM[blockID]
        let children = ""
        childrenIDs.forEach((childID) => {
            children = `${children} ${treeAtNode(childID, PCM)}`
        })

        let tree = `(${label} ${children})`

        //console.log(tree)
        //console.log(node.attr("data-wastraced"), node.attr("data-destination"))

        if (node.attr("data-wastraced")) {
            tree = tree.replace(/\)$/, ` ^t${node.attr("data-wastraced")})`)
        }
        if (node.attr("data-destination")) {
            tree = tree.replace(/\)$/, ` ^${node.attr("data-destination")})`)
        }
        //console.log(tree)

        return tree
    }

}

function showProblem(event, problem) {
    // console.log(event.clientY)
    $("#problemInfo").remove()
    // let note = problem.note || "";
    let problemInfo = `
    ${displayProblemRight(problem.expression)} `
    // <hr/>   ${note} 
    $(menu).append($("<div/>", { id: "problemInfo", html: problemInfo}))
}

function displayProblemRight(bracketedString) {
    let morphoDetecter;
    let morphoDetecterForNext = false;
    let morphoWords = [];
    let displayString = ""
    let string = bracketToString(bracketedString).replaceAll("&#x2009;", " ")
    console.log(string)
    string.split(' ').forEach((word) => {
        morphoDetecter = false;
        // console.log(word)
        let wordIndex = bracketedString.indexOf(` ${word})`)
        if (morphoDetecterForNext || bracketedString.startsWith(("(N ") || ("(V ") || ("(P ") || ("(Adj ") || ("(Adv "))) {morphoDetecterForNext = false; morphoDetecter = true;}
        if (bracketedString[wordIndex - 2] == "A" && bracketedString[wordIndex - 1] == "f") {
            morphoWords.push(word);
            if (bracketedString[wordIndex+word.length+3] == "(") {
                morphoDetecterForNext = true;
            } 
            if (bracketedString[wordIndex+word.length+1] == ")") {
                morphoDetecter = true;
            }
        }
        if (word.includes("#")) {
            let intersect = word.indexOf("#")
            word = word.slice(0, intersect)
        }
        if (word.includes("|")) {
            let affixIntersect = word.indexOf("|")
            word = word.slice(0, affixIntersect)
        }
        if (word.includes("+")) {
            word = ""
        }
        if (word.startsWith("'") || morphoDetecter) {
            displayString = displayString.concat(word);
        } else {
            displayString = displayString.concat(" ", word);
        }
    })

    return displayString.replaceAll("*", " ");
}

function treeToString(tree) {
    if (typeof tree == "string") {

        return tree + ' '
    }
    else if (typeof tree.children == "string") {

        return tree.children //+ ' '
    }
    else if (Array.isArray(tree.children)) {

        return tree.children.reduce((acc, subtree) => {


            return acc + treeToString(subtree)
        }, "")
    }

}

// function bracket to string was moved to separate file

function treeToRows(tree, accumulator = [], row = 0, leaves = [], morphologyParts = []) {
    // try having index originate with leaves
    //console.log(leaves)
    //console.log(tree.trace, tree.index)
    accumulator[row] = accumulator[row] || []
    let highestColumn = 0
    let changed = "";
    //base case
    //string child
    if (!Array.isArray(tree.children)) {
        let index = leaves.length
        leaves.push(tree.children)
        let constituent;
        [constituent, changed] = changedWordDetector(tree.children, row);
        if (constituent&&constituent.includes("|")) {constituent = flexiableAffix(constituent)}
        // accumulator[row].push({label:tree.label, constituent:tree.children, column:index})
        let newEntry = { label: tree.label, constituent: constituent, column: index }
        if (typeof tree.mode !== 'undefined') {
            morphologyParts.push(tree.children)
            $("#sentenceContainer").attr("data-morphologyparts", morphologyParts)
            // console.log(morphologyParts, tree.children)
        }
        if (changed != "") {
            newEntry['changed'] = changed
        }
        if (typeof tree.trace !== 'undefined') {
            newEntry['trace'] = tree.trace
            if (($("#sentenceContainer").attr("data-traceNum") && $("#sentenceContainer").attr("data-traceNum") < tree.trace) || ($("#sentenceContainer").attr("data-traceNum")==undefined)) {
                $("#sentenceContainer").attr("data-traceNum", tree.trace)
            }
            $("#problemConstituent").attr("data-targetRow", row)
        }
        if (typeof tree.index !== 'undefined') {
            newEntry['destination'] = tree.index
        }
        if (constituent &&constituent.includes("+") && constituent.split(" ").length == 1) {
            $("#sentenceContainer").attr("data-tense", constituent)
        } else {
        accumulator[row].push(newEntry)}
        return [tree.children, index]
    } else {
        let constituent = []
        let column = 0
        tree.children.forEach(function (child, i) {
            //console.log(child, i)
            let [word, index] = treeToRows(child, accumulator, row + 1, leaves, morphologyParts)
            if (index > highestColumn) {
                highestColumn = index
            }
            //console.log(word, index)
            //console.log(child.trace)
            if (typeof child.trace === 'undefined') { // don't include trace words
                //console.log("no trace")
                constituent.push(word)
            }
            // constituent.push(word)
            if (i == 0) { // constituent gets index of first word
                column = index
            }
        })
        // console.log(constituent)
        // accumulator[row].push({label:tree.label, constituent:constituent.join(" "), column:column})
        let groupedConstituent;
        [groupedConstituent, changed]= changedWordDetector(constituent.join(" "), row) || [constituent.join(" "), constituent.join(" ")];
        if (groupedConstituent&&groupedConstituent.includes("|")) {groupedConstituent = flexiableAffix(groupedConstituent)}
        let newEntry = { label: tree.label, constituent: groupedConstituent, column: column }
        if (typeof tree.trace !== 'undefined') {
            newEntry['trace'] = tree.trace
            if (($("#sentenceContainer").attr("data-traceNum") && $("#sentenceContainer").attr("data-traceNum") < tree.trace) || ($("#sentenceContainer").attr("data-traceNum")==undefined)) {
                $("#sentenceContainer").attr("data-traceNum", tree.trace)
            }
            $("#problemConstituent").attr("data-targetRow", row)
        }
        if (changed != "") {
            newEntry['changed'] = changed
        }
        if (typeof tree.mode !== 'undefined' && $("#sentenceContainer").attr("data-morphologyparts") == undefined) {
            $("#sentenceContainer").attr("data-morphologyparts", tree.children)
        }
        if (typeof tree.index !== 'undefined') {
            newEntry['destination'] = tree.index
        }
        if (groupedConstituent&& groupedConstituent.split(" ").length == 1&&groupedConstituent.includes("+")) {
            $("#sentenceContainer").attr("data-tense", groupedConstituent)
        } else if (groupedConstituent&&groupedConstituent.includes("+")){
            let tenseIntersect = groupedConstituent.indexOf("+")
            let firstPartWithoutTense = groupedConstituent.slice(0, tenseIntersect)
            let secondPartWithTense = groupedConstituent.slice(tenseIntersect+1)
            let secondPartWithoutTense = secondPartWithTense.slice(secondPartWithTense.indexOf(" ")+1)
            groupedConstituent = firstPartWithoutTense + secondPartWithoutTense
            newEntry.constituent = groupedConstituent
            accumulator[row].push(newEntry)
        } else {accumulator[row].push(newEntry)}
        if (row == 0) {
            return accumulator
        } else {
            if (mode == "morphology") {return [constituent.join(""), column]}
            // console.log([constituent.join(" "), column])
            return [constituent.join(" "), column]
        }
    }

}

function flexiableAffix(constituent) {
    let affixIntersect = constituent.indexOf("|")
    let displayedWord = constituent.slice(0, affixIntersect)
    let affixes = $("#sentenceContainer").attr("data-morphologyparts")
    let flexAf;
    if (affixes!=undefined && affixes.includes("|")) {
        if (affixes.includes(",")) {
            affixes.split(',').forEach(af=> {
                if (af.includes("|")) {
                    flexAf = af
                }
            })
        } else {flexAf = affixes}
        let flexAfSet = flexAf.trim().split("|")
        let flexDifference = flexAfSet[0].substring(0, flexAfSet[0].length - flexAfSet[1].length)
        flexAfSet.push(flexDifference)
        $("#sentenceContainer").attr("data-flexAf", flexAfSet)
    }
    return displayedWord
}

function changedWordDetector(constituents, row) {
    let changedWordInput = []
    let numberOfRows;
    // console.log(constituents,row)
    if ($("#menu").attr("data-currentNumberOfRows")) 
        {numberOfRows = $("#menu").attr("data-currentNumberOfRows");} else {
            numberOfRows = 4
            return [constituents, ""]
        }
    if (!(constituents.includes("#"))) {return [constituents, ""]}
    let wordsSet = constituents.trim().split(/\s+/);
    let wordCount = wordsSet.length;
    let changed = "";
    let outputConstituent = constituents
    for (i = 0; i < wordCount; i ++) {
            if (wordsSet[i] && wordsSet[i].includes("#")) {
                changedWordInput.push(wordsSet[i])
                $("#sentenceContainer").attr("data-changedword", changedWordInput)
                let changedWordSet = wordsSet[i].trim().split("#");
                let changedWordCount = changedWordSet.length;
                // console.log(changedWordCount, changedWordSet)
                let outputConstituentIndex =  Math.max(changedWordCount-(numberOfRows-row), 0);
                let changedWordIndex =  Math.max(changedWordCount-(numberOfRows-(row-1)), 0);
                if (wordCount == 1) {return [changedWordSet[outputConstituentIndex], changedWordSet[changedWordIndex]]}
                outputConstituent = wordsSet.toSpliced(i, 1, changedWordSet[outputConstituentIndex]).join(" ")
                // console.log(outputConstituent, changedWordSet[outputConstituentIndex], changedWordIndex, row, changedWordCount, wordsSet)
                if (changed != 0) {
                    changed = changed.trim().split(/\s+/).toSpliced(i, 1, changedWordSet[changedWordIndex]).join(" ")
                    // console.log(changed, outputConstituent)
                } else {changed = wordsSet.toSpliced(i, 1, changedWordSet[changedWordIndex]).join(" ")}
                if (!(outputConstituent.includes("#"))) {return [outputConstituent,changed]} else {
                    wordsSet = outputConstituent.trim().split(/\s+/)
                    // console.log(wordsSet, outputConstituent)
                }
            }
    }
}

function getRows() {
    //for manual use only, so did not varified that should "data-index" be "data-blockindex" or not
    // makes row structure with labels and constituents from DOM
    let structure = []
    $("#problemConstituent").find("[data-row]").each(function (row) {
        structure[row] = []
        // //console.log(row)
        //console.log($(this))
        $(this).children().each(function (block) {
            // //console.log(block)
            console.log($(this))
            let label = $(this).find(".labelDiv").text()
            //console.log(label)
            let constituent = $(this).find(".constituentContainer").find(".wordContainer").toArray().map((wordContainer) => { return wordContainer.innerHTML }).join(" ")
            //console.log(constituent)
            // structure[row].push({label:label, constituent:constituent, column:$(this).attr("data-index")})
            let newEntry = { label: label, constituent: constituent, column: $(this).attr("data-index") }
            //console.log($(this).attr("data-index"))
            //console.log($(this).attr("data-destination"), $(this).attr("data-wastraced"))
            if ($(this).attr("data-wastraced")) {
                newEntry['trace'] = $(this).attr("data-wastraced")
            }
            if ($(this).attr("data-destination")) {
                newEntry['destination'] = $(this).attr("data-destination")
            }
            structure[row].push(newEntry)
        })
    })
    return structure
}

function isValid(tree, subtree) {

    // //console.log(tree)
    // //console.log(subtree)
    let flag = true
    subtree.forEach(function (row, i) {
        row.forEach(function (c) {
            // check for matching constituent, label, column
            if (!(tree[i].some(x => ((x.constituent === c.constituent)
                & (c.label == "?" || x.label == c.label)
                & (x.column === c.column || tracePad(i, x.column, c.column, tree)))))) { // or column it could have before trace changes it
                flag = false
                // //console.log(false)
                // is there a way to break out of the loops?
                // keep track of where it went wrong to highlight
            }
            else {
                // //console.log(true)
            }

        })
    })
    return flag

}


function tracePad(row, xCol, cCol, tree) {
    // x and c actually have equivalent columns if the element at c's column and all elements up to x
    // are traces
    // console.log(xCol, cCol)
    // console.log(tree[row], tree)
    // console.log(row.filter(n => n.column >= cCol && n.column < xCol))

    if (!tree[row]) {
        return 0// avoiding error
    }

    // split into variables
    // filterval
    // empty array should be false not true
    let traceNum = 0
    for (let i = row; i < tree.length; i++) {
        let filterval = tree[i].filter(n => n.column >= 0 && n.column < xCol)
        // console.log(filterval)
        if (!filterval.length) { // is this how you do it?
            console.log("empty")
        }
        filterval.forEach(n => {
            // //console.log(typeof n.trace !== undefined)
            // console.log(n.trace)
            if (n.trace) {
                traceNum += 1
        }
        // return (typeof n.trace !== undefined)
        // return n.trace
    })
    }
    // console.log(traceNum)
    // let filterval = tree.filter(n => n.column >= 0 && n.column < xCol)
    // console.log(filterval)
    // if (!filterval.length) { // is this how you do it?
    //     console.log("empty")
    //     return 0
    // }
    // let traceNum = 0
    // filterval.forEach(n => {
    //     // //console.log(typeof n.trace !== undefined)
    //     console.log(n.trace)
    //     if (n.trace) {
    //         traceNum += 1
    //     }
    //     // return (typeof n.trace !== undefined)
    //     // return n.trace
    // })
    return traceNum;

}

function isAncestor(node1, node2, pcm) {
    // takes jquery objects and map of parents to children
    // is node 1 an ancestor of node 2
    let id1 = node1.attr("id")
    let id2 = node2.attr("id")
    //console.log(id1, id2)
    if (id1 === id2) {
        return false
    } else if (!(id1 in pcm)) {
        // not ancestor of anything
        return false
    } else if (pcm[id1].includes(id2)) {
        // node 1 is parent of node 2
        return true
    } else {
        // recur
        return pcm[id1].some(x => isAncestor($(`#${x}`), node2, pcm))
    }
}

function updatePoints() {
    let minStep = getMinStep($("#sentenceContainer").attr("data-bracketedSentence"))
    let parFactor = getParFactor(minStep)
    let strokes = parseInt($("#problemConstituent").attr("data-strokes"))
    console.log($("#problemConstituent").attr("data-strokes"))
    $("#points").html(`par: ${parseInt(minStep+parFactor)}<br/>strokes: ${strokes}`)
}

function finishAlarm() {
    // console.log(globals.problemJSON)
    let currentSentenceID = parseInt($("#sentenceContainer").attr("data-currentSentenceID"))
    let minStep = getMinStep($("#sentenceContainer").attr("data-bracketedSentence"))
    let parFactor = getParFactor(minStep)
    let strokes = parseInt($("#problemConstituent").attr("data-strokes"))
    let positivePoint = parseInt($("#problemConstituent").attr("data-positivePoint"))
    let good = parseInt(minStep+parFactor)
    if (positivePoint == minStep) {
        let PJ=globals.problemJSON.holes[currentSentenceID];
        PJ.progress = PJ.progress || [] 
        PJ.progress.push(strokes);
       console.log(JSON.stringify(PJ),strokes)
	    let bestStep = bestProgress(PJ.progress)
	    let {flagColor, alarmForBest} = getProgressSignal(bestStep,good,minStep)
        console.log(bestStep, good, minStep)
        color = `--color_fill: ${flagColor};`
        // console.log(color)
        $(`#${currentSentenceID}`).attr("style", color)
        // if (PJ.progress.length == 1) {enableNext()}
        console.log(scoreUpdater())
    let problem_id = parseQuery(window.location.search).problem_id || 1
    
	if (!(typeof ses=== "undefined")){
        // ses.grade= globalScore(globals.problemJSON)/100;  
        ses.grade=scoreUpdater();
        console.log(ses)
        postLTI(ses,"du"); 
    }
    JSON_API(globals.problemJSON, problem_id,"POST").then(console.log)
    let {flagColor1, alarm} = getProgressSignal(strokes,good,minStep, true)
    finishDialog(alarm)
    
}}

function finishDialog(properties) {
    document.querySelector("#dialog")?.remove();
    let dialog = draggableDialog(properties, "dialog")
    document.querySelector("#sentenceContainer").append(dialog);
    dialog.showModal();
    // $("#dialog").append(meme)
}

function draggableDialog(properties, id) {
    let dialog = Object.assign(document.createElement("dialog"), { "id": id })
    const dragHeader = Object.assign(document.createElement("div"), {
        className: "dialogHeader"
    });
    const removeButton = Object.assign(document.createElement("button"), {
        innerHTML: "&times;", // A nice 'X' character
        className: "removeButton"
    }); 
    Object.keys(properties).forEach((prop) => {
        properties[prop].forEach((line) => {
            let current = Object.assign(document.createElement(prop), { "innerHTML": line })
            // current.addEventListener("click", (e) => { this.listen(e) })
            dialog.appendChild(current)
        })
    })
    removeButton.addEventListener("click", () => {
        dialog.close(); 
        dialog.remove(); 
    });
    const headerNotice = Object.assign(document.createElement("span"), {
        innerHTML: "Click Here To Drag",
        className: "headerNotice"
    }); 
    let isDragging = false;
    let offsetX, offsetY;

    const onMouseDown = (e) => {
        isDragging = true;
        const rect = dialog.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        dialog.style.left = `${e.clientX - offsetX}px`;
        dialog.style.top = `${e.clientY - offsetY}px`;
    };

    const onMouseUp = () => {
        isDragging = false;
        // IMPORTANT: Clean up by removing the listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    // Attach the initial mousedown event listener to the header
    dragHeader.addEventListener('mousedown', onMouseDown);
    headerNotice.addEventListener('mousedown', onMouseDown);
    dragHeader.appendChild(headerNotice);
    dragHeader.appendChild(removeButton);
    dialog.prepend(dragHeader);
    return dialog;
}

function getProgressSignal(strokes, weightedPar, minStep, final=false) {
    if (strokes == undefined) {
        // problemJSON.holes[currentSentenceID].progress = []
        return {"flagColor":"red", "alarm":""}
    }
    if (final) {
        let {allColor, countColor} = colorChecker("green")
        console.log(allColor, countColor)
        if (allColor=="true") {
            return {"flagColor":"green", "alarm":{ div: ["<img src='images/completed_final.png' id='finishMeme'/>"]}}
        }}
    if (strokes == minStep) {
        let returnItem =  {"flagColor":"green", "alarm":{ div: ["<video src='images/golf_perfect_final.mp4' autoplay id='finishMeme' />"]}}
        if (final) {returnItem = nextButton(returnItem)}
        return returnItem
    }
    else if (strokes > weightedPar) {
        let returnItem = {"flagColor":"red", "alarm": { div: ["<video src='images/redFlag.mp4' autoplay id='finishMeme' />"]}}
        returnItem = tryAgainButton(returnItem)
        return returnItem
    }
    else if (strokes <= weightedPar) {
        let returnItem =  {"flagColor":"yellow", "alarm":{ div: ["<video src='images/greenFlag.mp4' autoplay id='finishMeme' />"]}}
        returnItem = tryAgainButton(returnItem)
        return returnItem
    }
}

function tryAgainButton(returnItem){
    returnItem.alarm.div.push("<button id='again'>Try Again</button>")
    document.body.addEventListener('click', (event) => {
        if (event.target.id === 'again') {
            location.reload();
        }
    });
    return returnItem
}

function nextButton(returnItem) {
    if (!location.hash || location.hash.split("#")[1] != globals.problemJSON.holes.length) {
        // $("#menu").append(Object.assign(document.createElement("button"),{id:"next", innerHTML:"Next Hole"}))
        returnItem.alarm.div.push("<button id='next'>Next</button>")
    }
    document.body.addEventListener('click', (event) => {
        if (event.target.id === 'next') {
            window.location.hash=parseInt(location.hash.split("#")[1])+1 ||2
            location.reload();
        }
    });
    // document.querySelector("#next")?.addEventListener('click', ()=>{
    //     window.location.hash=parseInt(location.hash.split("#")[1])+1 || 2
    // }); 
    return returnItem
}

function colorChecker(flagColor){
    let countFlagColor = 0
    let flagList = document.querySelectorAll(".flag")
    let flagArray = [...flagList]
    console.log(flagArray, flagList)
    let allColor = true
    flagArray.forEach(flag=>{
        let style = $(`#${flag.id}`).attr("style")
        console.log(flag, style)
        if (style === `--color_fill: ${flagColor};`){
            countFlagColor+=1
        } else {
            allColor = false
        }
    })
    console.log(`${allColor}`)
    return {"allColor": `${allColor}`, "countColor": countFlagColor}
}

// function globalScore(problemJSON) {
//     let numberOfHoles = problemJSON.holes.length
//     let scores = 0
//     let score
//     problemJSON.holes.forEach((hole) => {
//         bracketedSentence = hole.expression
//         let min = getMinStep(bracketedSentence)
// 	    let userBest = bestProgress(hole.progress)
//         let max = Math.max(min*3, 8)
//         let range = max - min;
//         let x = 1 - (userBest - min)/range
//         score = Math.ceil(1/Math.pow((x-1.1),2)) || 0
//         scores = scores + score
//         console.log(min, userBest, max, score)
//     })

//     globalS = scores/numberOfHoles
//     return globalS
// }

function scoreUpdater(){
    var {allColor, countColor} = colorChecker("green")
    let countGreen = countColor
    var {allColor, countColor} = colorChecker("yellow")
    let countYellow = countColor
    console.log(countGreen, countYellow)
    let globalScore = (countGreen*2+countYellow)/20
    if (countGreen == 9) {
        globalScore = 1;
    }
    return globalScore
}

function getNumberOfRows(tempTree) {
    let currentNumberOfRows =tempTree.length;
    $("#menu").attr("data-currentNumberOfRows", currentNumberOfRows)
    // console.log(currentNumberOfRows)
}

function leftPad(rowJQ) {
    //console.log(rowJQ.children().first())
    // console.log(rowJQ)
    let firstItem = rowJQ.children().first()
    firstItem.addClass("first")
    let firstIndex = firstItem.attr("data-blockindex")
    rowJQ.css({ "padding-left": `${firstIndex * 8}em` })

    rowJQ.children().css({ "padding-left": 0 })
    //rowJQ.prepend($("<img/>"))
    // firstItem.css({ "padding-left": `${firstIndex * 10}rem` })
    console.log(firstItem.css("padding-left"))

}

function leftPadAll() {
    $("#problemConstituent").children().each(function (rownum, rowval) {
        // console.log(rownum, rowval)
        leftPad($(rowval))
    })
}

function findRowInPCM(id, pcm) {

    function findRowInPCM2(id, count = 0) {
        // console.log(id)
        // console.log(pcm)
        // console.log(Object.keys(pcm))
        // console.log(count, $(`#${id}`))
        //let count = 0
        // start from top? and count how many times it needs to recurse
        // or find parent and keep going until it reaches the top and count how many steps
        let parentID = Object.keys(pcm).filter(x => pcm[x].includes(id))[0]
        // console.log(parentID)

        if (parentID === undefined) {
            console.log(count)
            return count
        }
        else {
            //return count + findRowInPCM(parentID, pcm, count+1)
            //count = count + findRowInPCM2(parentID, count+1)
            let nextStep = findRowInPCM2(parentID, count + 1)
            count += nextStep
            // console.log(nextStep)
            console.log(count)
            return count
            // this gets too large
        }

    }
    return findRowInPCM2(id)

}
// delete?

function updateIndicesAfterTrace(trace) {
    // console.log($(trace))
    let j = $(trace).attr("data-blockindex")
    $("[data-blockindex].block").filter(function () {
        console.log($(this))
        return $(this).attr("data-blockindex") >= j
    }).each((i, e) => {
        console.log($(e))
        // update all except element itself and its ancestors
        // if (!($(e).attr("id") === $(trace).attr("id") || isAncestor($(e), $(trace), getParentChildrenMap()))) {
        //     $(e).attr("data-blockindex", parseInt($(e).attr("data-blockindex")) + 1)
        //     $(e).attr("data-blockindex", $(e).attr("data-blockindex"))
        // }
    })
}

function drawArrows() {
    // 1. Clear and recreate Defs/Marker using pure DOM methods
    // This avoids jQuery SVG namespace bugs
    $("#lineContainer").find("defs").remove();
    
    const svgNS = "http://www.w3.org/2000/svg";
    let defs = document.createElementNS(svgNS, "defs");
    let marker = document.createElementNS(svgNS, "marker");
    let trianglePath = document.createElementNS(svgNS, "path");

    // Set marker attributes properly
    marker.setAttribute("id", "triangle");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "8"); // Moves the triangle tip to the exact end of the line
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerUnits", "strokeWidth");
    marker.setAttribute("markerWidth", "5");
    marker.setAttribute("markerHeight", "5");
    marker.setAttribute("orient", "auto");

    // Draw the triangle
    trianglePath.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");

    marker.appendChild(trianglePath);
    defs.appendChild(marker);
    document.getElementById("lineContainer").appendChild(defs);

    // 2. Get the SVG container's exact bounding box
    const svgRect = document.getElementById("lineContainer").getBoundingClientRect();

    // 3. Draw curves for each traced element
    // Safely ignore Dragula clones!
    $(".traced").not('.gu-transit, .gu-mirror').each((i, block) => {
        let startPoint = $(block).find(".constituentContainer");
        let endPoint = $(`[data-dest=${$(block).attr("data-traceindex")}]`).find(".constituentContainer");
    
        if (!startPoint.length || !endPoint.length) {
            return; // Skip if either element isn't found
        }

        // --- Exact pixel calculations (Replacing getCorners) ---
        let startRect = startPoint[0].getBoundingClientRect();
        let endRect = endPoint[0].getBoundingClientRect();

        // Start X/Y
        let startCenterX = (startRect.left + (startRect.width / 2)) - svgRect.left;
        let startBottom = startRect.bottom - svgRect.top;

        // End X/Y
        let endCenterX = (endRect.left + (endRect.width / 2)) - svgRect.left;
        let endBottom = endRect.bottom - svgRect.top;

        // --- Define control points for the cubic Bezier curve ---
        let control1X = startCenterX;
        let control1Y = startBottom + 100;

        let control2X = endCenterX;
        let control2Y = endBottom + 100;

        if ($(block).attr("data-traceindex") == "1") {
            control1Y = startBottom + 100; 
            control2Y = endBottom + 300;
        }

        // 4. Create and append the SVG path element
        let path = document.createElementNS(svgNS, "path");
        
        path.setAttribute("d", `M ${startCenterX} ${startBottom} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endCenterX} ${endBottom}`);
        path.setAttribute("class", "arrow");
        path.setAttribute("fill", "transparent"); // Crucial so the curve doesn't fill in like a shape
        path.setAttribute("marker-end", "url(#triangle)");

        document.getElementById("lineContainer").appendChild(path);
    });
}

function bezierCurve(t, initial, p1, p2, final) {
    return (
        (1 - t) * (1 - t) * (1 - t) * initial
        +
        3 * (1 - t) * (1 - t) * t * p1
        +
        3 * (1 - t) * t * t * p2
        +
        t * t * t * final
    );}


function getSize() {
    return [$("#lineContainer").width(), $("#lineContainer").height()]
}

function getCornerPercentages(elem) {
    let [left, top, right, bottom] = getCorners(elem)
    // console.log(left, top, right, bottom)
    let [containerWidth, containerHeight] = getSize()
    // console.log(containerWidth, containerHeight)
    let leftPercent = left / containerWidth * 100
    let rightPercent = right / containerWidth * 100
    let topPercent = top / containerHeight * 100
    let bottomPercent = bottom / containerHeight * 100
    //return Object.values({leftPercent, topPercent, rightPercent, bottomPercent})

    let centerXPercent = (leftPercent + rightPercent) / 2
    let centerYPercent = (topPercent + bottomPercent) / 2
    // console.log(leftPercent, topPercent, rightPercent, bottomPercent, centerXPercent, centerYPercent)
    return [leftPercent, topPercent, rightPercent, bottomPercent, centerXPercent, centerYPercent]

    // replace calculations in drawLine with this
}

function templateHelper(bracketedSentence) {
    let sentence = parse(bracketedSentence)
    let totalColumn = 0
    while (typeof sentence.children != string) {
        sentence.forEach(x => {
            if (typeof x.children == string) {
                totalColumn += x.children.split("\\s+").length
            } else {
                sentenceArray = x
            }
        })
    }
    console.log(totalColumn)
    return totalColumn
}

function getMinStep(bracketedSentence) {
    let str = bracketedSentence
    let parses = 0
    let numberOfLabels = 0
    let numberOfDrag = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) == "(") {
            parses++ //each block have one parses
            numberOfLabels++ 
        }
        // if (str.charAt(i) == "&") {
        //     numberOfLabels-- //AF with no label
        // }
        // if (str.charAt(i) == "^") {
        //     numberOfDrag++
        // }
        if (str.charAt(i) == "+") {
            parses--
        }
    }
    parses -= 1;
    let minStep = parses + numberOfLabels;
    // minStep -= numberOfAf;
    return minStep
}

function getParFactor(minStep){
    return Math.max(minStep*0.2, 2)
}

function bestProgress(progress) {
    let progressCopy
    if (progress == undefined) {
        progressCopy = []
    } else {
        progressCopy = progress.slice()
    }
    // function(a, b){return a - b}
    let sortedProgress = progressCopy.sort(function(a, b){return a - b})
    // console.log(sortedProgress)
    return sortedProgress[0]
}


function getSafeLabels(bracketedSentence, courseNum) {
    let labelsInSentence = new Set();
    let matches = bracketedSentence.matchAll(/\(([A-Za-z0-9"']+)/g);
    for (const match of matches) {
        let raw = match[1];
        let base = raw;
        if (base.endsWith("P") && base.length > 1 && base !== "TP" && base !== "CP" && base !== "DP" && base !== "PP") {
             base = base.slice(0, -1);
        } else if (base === "PP") base = "P";
        else if (base === "CP") base = "C";
        else if (base === "TP") base = "T";
        else if (base === "DP") base = "D";
        
        base = base.replace(/'/g, "");
        
        if (base.toLowerCase() === "adj") base = "adj";
        if (base.toLowerCase() === "adv") base = "adv";
        if (base.toLowerCase() === "det") base = "det";
        if (base.toLowerCase() === "deg") base = "deg";
        
        labelsInSentence.add(base);
    }

    let allowed = new Set(labelsInSentence);
    
    if (parseInt(courseNum) >= 14) {
        allowed.add("N");
        allowed.add("V");
        allowed.add("adj");
        allowed.add("det");
        allowed.add("S");
    }

    allowed.delete("PossN");

    if (labelsInSentence.has("D")) {
        allowed.delete("det");
        allowed.add("D");
    } else if (labelsInSentence.has("det")) {
        allowed.delete("D");
        allowed.add("det");
    } else {
        if (allowed.has("det")) allowed.delete("D");
    }

    if (labelsInSentence.has("T") || labelsInSentence.has("TP")) {
        allowed.delete("S");
        allowed.add("T");
    } else if (labelsInSentence.has("S")) {
        allowed.delete("T");
        allowed.add("S");
    } else {
        if (allowed.has("S")) allowed.delete("T");
    }

    let hasAdjAdv = (labelsInSentence.has("adj") || labelsInSentence.has("adv"));
    let hasA = labelsInSentence.has("A");

    if (hasA) {
        allowed.delete("adj");
        allowed.delete("adv");
        allowed.add("A");
    } else if (hasAdjAdv) {
        allowed.delete("A");
    } else {
        if (allowed.has("adj") || allowed.has("adv")) allowed.delete("A");
    }
    
    return allowed;
}
