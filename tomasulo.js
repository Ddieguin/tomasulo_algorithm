//tomasulo.js
import State from "./state.js"

function getSetup() {
    var setup = {};

    var cycles = {}

    cycles["Integer"] = $("#cyclesInt").val();
    cycles["Add"] = $("#cyclesFPAdd").val();
    cycles["Mult"] = $("#cyclesFPMul").val();
    cycles["Div"] = $("#cyclesFPDiv").val();
    cycles["Load"] = $("#cyclesLoad").val();
    cycles["Store"] = $("#cyclesStore").val();


    if ((cycles["Integer"] < 1) || (cycles["Add"] < 1) || (cycles["Div"] < 1) ||
        (cycles["Mult"] < 1) || (cycles["Load"] < 1)  || (cycles["Store"] < 1)) {
        alert("The quantity of cycles per instruction, for all units, must be at least 1 cycle!");
        return null;
    }

    setup["cycles"] = cycles

    var units = {}
    units["Integer"] = $("#fuInt").val();
    units["Add"] = $("#fuFPAdd").val();
    units["Mult"] = $("#fuFPMul").val();
    
    if ((units["Integer"] < 1) || (units["Add"] < 1) ||
    (units["Mult"] < 1)) {
        alert("The quantity of functional units must be at least 1!");
        return;
    }
    
    var unitsMem = {}
    unitsMem["Load"] = $("#fuLoad").val();
    unitsMem["Store"] = $("#fuStore").val();


    if(units["Load"] < 1 || unitsMem["Store"] < 1) {
        alert("The quantity of memory functional units must be at least 1!");
        return;
    }


    setup["units"] = units;
    setup["unitsMem"] = unitsMem;
    return setup;
}

function getInst(instruction_text, i) {

    const [d, r, s, t] = instruction_text.replaceAll(",", "").split(" ");

    var inst = {};
    inst["index"] = i;
    inst["d"] = d
    inst["r"] = r
    inst["s"] = s
    inst["t"] = t

    return inst;
}


function alertValidInst(instruction) {
    let text = "A instrução \n";
    text += instruction["d"] + " " + instruction["r"] + ", ";
    text += instruction["s"] + ", " + instruction["t"];
    text += " no atende os paramêtros do command " + instruction["d"];
    alert(text);
}

function isInteger(number) {
    var value = parseInt(number);
    if (value != number){
        return false;
    }
    return true;
}

function invalidRegisterR(register) {
	 return (register[0] != 'R' || register.replace("R", "") == "" || isNaN(register.replace("R", "")))
            || !(isInteger(register.replace("R", "")));
}

function invalidRegisterF(register) {
    return (register[0] != 'F' || register.replace("F", "") == "" ||
        register.replace("F", "") % 2 != 0 || register.replace("F", "") > 30) ||
        !isInteger(register.replace("F", ""));
}

function validateInstruction(instruction) {
    var unit = getInstructionUnit(instruction["d"]);
    if(!unit) {
        alert("The instruction command is invalid!");
        return false;
    }

    if(unit == "Load" || unit == "Store") {
        var command = instruction["d"]

        if(command == "LD" || command == "SD") {
            if(invalidRegisterF(instruction["r"]) || isNaN(parseInt(instruction["s"])) || invalidRegisterR(instruction["t"])) {
                alertValidInst(instruction);
                return false;
            }
            return true;
        }
    }

    if(unit == "Integer") {
        var command = instruction["d"]

        if(command == "BEQ") {
            if(invalidRegisterR(instruction["r"]) || invalidRegisterR(instruction["s"]) || (instruction["t"].replace(" ", "") == "")) {
                alertValidInst(instruction);
                return false;
            }
            return true;
        }
        if(command == "BNEZ") {
            if(invalidRegisterR(instruction["r"]) || (instruction["s"].replace(" ", "") == "") || (instruction["t"].replace(" ", "") != "")) {
                alertValidInst(instruction);
                return false;
            }
            return true;
        }
        if(command == "ADD") {
            if(invalidRegisterR(instruction["r"]) || invalidRegisterR(instruction["s"]) || invalidRegisterR(instruction["t"])) {
                alertValidInst(instruction);
                return false;
            }
            return true;
        }
        if(command == "DADDUI") {
            if(invalidRegisterR(instruction["r"]) || invalidRegisterR(instruction["s"]) || isNaN(parseInt(instruction["t"]))) {
                alertValidInst(instruction);
                return false;
            }
        }
        return true;
    }

    if(invalidRegisterF(instruction["r"]) || invalidRegisterF(instruction["s"]) || invalidRegisterF(instruction["t"])) {
        alertValidInst(instruction);
        return false;
    }
    return true;

}

function getAllInst() {
    var insts = []  

    const instructions_text = document.getElementById("instructions");
    const instructions = instructions_text.value.split("\n"); 

    
    for (var i = 0; i < instructions.length; i++) {
        var instruction = getInst(instructions[i], i);
        if(!validateInstruction(instruction)) {
            return null;
        }
        insts.push(instruction);
    }

    return insts;
}

function getInstructionUnit(instruction) {
    switch (instruction) {
        case "ADD":
            return "Integer";
        case "DADDUI":
            return "Integer";
        case "BEQ":
            return "Integer";
        case "BNEZ":
            return "Integer";

        case "SD":
            return 'Store';
        case "LD":
            return "Load";
        

        case "SUBD":
            return "Add";
        case "ADDD":
            return "Add";

        case "MULTD":
            return "Mult";
        case "DIVD":
            return "Mult";

        default:
            return null
    }
}

// -----------------------------------------------------------------------------

function updateStateTableHTML(tableInsts) {
    for(let i in tableInsts) {
        const inst = tableInsts[i];
        $(`#i${inst["position"]}_is`).text(inst["issue"] ? inst["issue"] : "");
        $(`#i${inst["position"]}_ec`).text(inst["execute"] ? inst["execute"] : "");
        $(`#i${inst["position"]}_wr`).text(inst["write"] ? inst["write"] : "");
    }
}

function updateStateTableUFHTML(ufs) {
    for(let i in ufs) {
        const uf = ufs[i];
        $(`#${uf["name"]}_time`).text((uf["time"] !== null) ? uf["time"] : "");
        $(`#${uf["name"]}_busy`).text((uf["busy"]) ? "yes" : "no");
        $(`#${uf["name"]}_operation`).text(uf["operation"] ? uf["operation"] : "");
        $(`#${uf["name"]}_vj`).text(uf["vj"] ? uf["vj"] : "");
        $(`#${uf["name"]}_vk`).text(uf["vk"] ? uf["vk"] : "");
        $(`#${uf["name"]}_qj`).text(((uf["qj"]) && (uf["qj"] !== 1)) ? uf["qj"] : "");
        $(`#${uf["name"]}_qk`).text(((uf["qk"]) && (uf["qk"] !== 1)) ? uf["qk"] : "");
    }
}

function updateStateTableMemHTML(mem) {
    for (var reg in mem) {
        console.log("reg ", reg)
        $(`#${reg}`).html(mem[reg] ? mem[reg] : "&nbsp;");
    }
}

function updateClock(clock) {
    $("#clock").html("<h3>Cycle_Current: <small id='clock'>" + clock + "</small></h3>");

}

function generateStateTableInstructionHTML(diagram) {
    var s = (
        "<h3>Instructions State</h3><table class='table table-bordered border-primary'>"
        + "<tr><th></th><th>Instruction</th><th>i</th><th>j</th>"
        + "<th>k</th><th>Issue</th><th>Execute</th><th>Write</th></tr>"
    );

    for (let i = 0 ; i < diagram.configuration["numInstructions"]; ++i) {
        let instruction = diagram.instructionsState[i].instruction;
        s += (
            `<tr> <td>I${i}</td> <td>${instruction["operation"]}</td>
            <td>${instruction["registerR"]}</td> <td>${instruction["registerS"]}</td> <td>${instruction["registerT"]}</td>
            <td id='i${i}_is'></td></td> <td id='i${i}_ec'></td>
            <td id='i${i}_wr'></td> </tr>`
        );
    }

    s += "</table>";
    $("#stateInst").html(s);
}

function generateStateTableUFHTML(diagram) {
    console.log("AAAAA");
    var s = (
        "<h3>Reservations Stations</h3><table class='table table-bordered border-primary'><tr> <th>Time</th> <th>UF</th> <th>Busy</th>"
        + "<th>Op</th> <th>Vj</th> <th>Vk</th> <th>Qj</th> <th>Qk</th>"
    );

    console.log(diagram.functionalUnits);
    let functionalUnits = diagram.functionalUnits;
    for(let key in functionalUnits) {
        var uf = functionalUnits[key];

        s += `<tr><td id="${uf["name"]}_time"></td>
             <td>${uf["name"]}</td> <td id="${uf["name"]}_busy"></td>
             <td id="${uf["name"]}_operation"></td>
             <td id="${uf["name"]}_vj"></td> <td id="${uf["name"]}_vk"></td>
             <td id="${uf["name"]}_qj"></td> <td id="${uf["name"]}_qk"></td>
             `
    }

    s += "</table>"
    $("#stateUF").html(s);
}

function generateStateTableMemHTML(diagram) {
    var s = `<h3>Register Status</h3> <table class='table table-bordered border-primary'>`;

    for(var i = 0; i < 2; ++i) {
        s += `<tr>`
        for(var j = 0; j < 16; j += 2) {
            s += `<th>F${j+i*16}</th>`
        }
        s += `</tr> <tr>`
        for(var j = 0; j < 16; j += 2) {
            s += `<td id="F${j+i*16}">&nbsp;</td>`
        }
        s += `</tr>`
    }

    s += "</table>"
    $("#stateMem").html(s);
}

function generateStateTableUFMem(diagram) {
    var s = (
        "<h3>Reservations Stations Load/Store</h3><table class='table table-bordered border-primary'>"
        + "<tr><th>Time</th><th>Instruction</th><th>Busy</th><th>Address</th>"
        + "<th>Destination</th>"
    );
    for(let key in diagram.functionalUnitsMemory) {
        var ufMem = diagram.functionalUnitsMemory[key];

        s += `<tr><td id="${ufMem["name"]}_time"></td>
             <td>${ufMem["name"]}</td> <td id="${ufMem["name"]}_busy"></td>
             <td id="${ufMem["name"]}_address"></td><td id="${ufMem["name"]}_destination"></td>
             `
    }
    s += "</table>"
    $("#stateMemUF").html(s);
}

function updateStateTableUFMemHTML(ufsMem) {
    for(let key in ufsMem) {
        const ufMem = ufsMem[key];
        $(`#${ufMem["name"]}_time`).text((ufMem["time"] !== null) ? ufMem["time"] : "");
        $(`#${ufMem["name"]}_busy`).text((ufMem["busy"]) ? "yes" : "no");
        $(`#${ufMem["name"]}_operation`).text(ufMem["operation"] ? ufMem["operation"] : "");
        $(`#${ufMem["name"]}_address`).text(ufMem["address"] ? ufMem["address"] : "");
        $(`#${ufMem["name"]}_destination`).text(ufMem["destination"] ? ufMem["destination"] : "");
    }
}

function confirmNInst() {
    var nInst = $("#nInst").val();
    if(nInst < 1) {
        alert("The number of instructions must be at least 1!");
        return false;
    }
    return true;
}


function cleanFields() {
    $("#nInst").val(1);

    $("#cyclesInt").val(1);
    $("#cyclesFPAdd").val(1);
    $("#cyclesFPMul").val(1);
    $("#cyclesFPDiv").val(1);

    $("#fuStore").val(1);
    $("#fuLoad").val(1);
    $("#fuInt").val(1);
    $("#fuFPAdd").val(1);
    $("#fuFPMul").val(1);

    $("#clock").html("");
    $("#stateInst").html("");
    $("#stateMemUF").html("");
    $("#stateUF").html("");
    $("#stateMem").html("");
}


$(document).ready(function() {
    var diagram = null;
    var finished = false;

    $("#clean").click(function() {
        cleanFields();
    })

    $("#send").click(function() {
       
        const setup = getSetup();

        if(!setup) {
            return;
        }

        var insts = getAllInst();

        setup["nInst"] = insts.length;

        if(!insts) {
            return;
        }

        diagram = new State(setup, insts);
        generateStateTableInstructionHTML(diagram);
        updateStateTableHTML(diagram["table"])
        console.log("Diagram table ", diagram['table'])
        generateStateTableUFHTML(diagram);
        updateStateTableUFHTML(diagram["uf"]);
        generateStateTableMemHTML(diagram);
        generateStateTableUFMem(diagram);
        updateStateTableUFMemHTML(diagram["ufMem"]);
        finished = false;
        $("#clock").html("<h3>Clock: <small id='clock'>0</small></h3>");
    });

    $("#next").click(function() {
        if(!diagram) {
            alert("First send");
            return;
        }
        if(finished) {
            alert("All instructions completed.");
            return;
        }
        finished = diagram.execute_cycle();
        updateStateTableHTML(diagram.instructionsState);
        updateStateTableUFMemHTML(diagram.functionalUnitsMemory);
        updateStateTableUFHTML(diagram.functionalUnits);
        updateStateTableMemHTML(diagram.registerStation);
        updateClock(diagram.clock);

    });
    $("#result").click(function() {
        if(!diagram) {
            alert("First send!");
            return;
        }
        while(!finished) {
            finished = diagram.execute_cycle();
            updateStateTableHTML(diagram.instructionsState);
            updateStateTableUFMemHTML(diagram.functionalUnitsMemory);
            updateStateTableUFHTML(diagram.functionalUnits);
            updateStateTableMemHTML(diagram.registerStation);
            updateClock(diagram.clock);
        }
    });
});


document.getElementById("robEnable").addEventListener("change", function () {
    const input_size_of_rob = document.getElementById("sizeRobDiv");

    if(this.checked) {
        input_size_of_rob.style.visibility = "visible";
    } else {
        input_size_of_rob.style.visibility = "hidden";
    }
})

function generateROB() {
    const divROB = document.getElementById("ROB_div");
    const instTableRow = document.getElementById("instTableRow");
  
    divROB.innerHTML = `
    <h5>Reorder Buffer (ROB)</h5>
      <table class="table table-bordered border-primary">
        <thead>
          <tr>
            <th>Entry</th>
            <th>Busy</th>
            <th>Instruction</th>
            <th>State</th>
            <th>Dst.</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody id="ROB_tableBody">
          <!-- content -->
        </tbody>
      </table>`;
  
    instTableRow.innerHTML = `<th>Instruction</th>
    <th>Issue</th>
    <th>Execute</th>
    <th>Write Result</th>
    <th>Commit</th>`;
}


function hideROB() {
    const divROB = document.getElementById("ROB_div");
    const instTableRow = document.getElementById("instTableRow");
  
    divROB.innerHTML = "";
    instTableRow.innerHTML = `<th>Instruction</th>
    <th>Issue</th>
    <th>Execute</th>
    <th>Write Result</th>`;
  }