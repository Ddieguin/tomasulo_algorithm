export default class State {
    constructor(setup, instructions) {
        this.configuration = {
            "numInstructions": setup["nInst"],
            "cycles": setup["cycles"],       
            "units": setup["units"]    
        };

        this.instructionsState = [];
        for(let i = 0; i < this.configuration["numInstructions"]; i++) {
            let line = {}
            line["instruction"] = {                      
                "operation": instructions[i]["d"],
                "registerR": instructions[i]["r"],
                "registerS": instructions[i]["s"],
                "registerT": instructions[i]["t"],
            };

            line["position"] = i;                      
            line["issue"] = null;                     
            line["execute"] = null;               
            line["write"] = null;                     
            this.instructionsState[i] = line;
        
        }
        
        this.functionalUnits = {};
        for (var unitType in setup["units"]) {
            for (let i = 0; i < setup["units"][unitType]; i++) {
                let functionalUnit = {};
                functionalUnit["instruction"] = null;           
                functionalUnit["instructionState"] = null;     
                functionalUnit["unitType"] = unitType;  
                functionalUnit["time"] = null;               

                let name = unitType + (i+1);                 
                functionalUnit["name"] = name;
                functionalUnit["busy"] = false;            

                functionalUnit["operation"] = null;           
                functionalUnit["vj"] = null;                 
                functionalUnit["vk"] = null;                 
                functionalUnit["qj"] = null;                  
                functionalUnit["qk"] = null;                  

                this.functionalUnits[name] = functionalUnit;
            }
            
        }

        this.functionalUnitsMemory = {}
        for(var unitType in setup["unitsMem"]) {
            for(let i = 0; i < setup["unitsMem"][unitType]; i++) {
                let functionalUnitMemory = {};
                functionalUnitMemory["instruction"] = null;            
                functionalUnitMemory["instructionState"] = null;      
                functionalUnitMemory["unitType"] = unitType;   
                functionalUnitMemory["time"] = null;                

                let name = unitType + (i+1);                         
                functionalUnitMemory["name"] = name;
                functionalUnitMemory["busy"] = false;                
                functionalUnitMemory["qi"] = null;                   
                functionalUnitMemory["qj"] = null;                   
                
                functionalUnitMemory["operation"] = null;             
                functionalUnitMemory["address"] = null;             
                functionalUnitMemory["destination"] = null;              
                
                this.functionalUnitsMemory[name] = functionalUnitMemory;
            }
        }

        this.clock = 0;       
        this.registerStation = {}
        for(let i = 0; i < 32; i += 2) {
            this.registerStation["F" + i] = null;
        }
        for(let i = 0; i < 32; i += 1) {
            this.registerStation["R" + i] = null;
        }
    }

    getNewInstruction() {
        for (let i = 0; i < this.instructionsState.length; i++) {
            const element = this.instructionsState[i];
            if(element.issue == null)
                return element;
        }
        return undefined;
    }

    verifyUFInstruction(instruction) {
        switch (instruction.operation) {
            case 'ADDD':
                return 'Add'
            case 'SUBD':
                return 'Add'
            case 'MULTD':
                return 'Mult'
            case 'DIVD':
                return 'Mult'
            case 'LD':
                return 'Load'
            case 'SD':
                return 'Store'
            case 'ADD':
                return 'Integer'
            case 'DADDUI':
                return 'Integer'
            case 'BEQ':
                return 'Integer'
            case 'BNEZ':
                return 'Integer'
        }
    }

    getEmptyFU(typeFU) {
        if ((typeFU === 'Load') || (typeFU === 'Store')) {
            for(let key in this.functionalUnitsMemory) {
                var ufMem = this.functionalUnitsMemory[key];
                if (ufMem.unitType === typeFU) {
                    if (!ufMem.busy) {
                        return ufMem;
                    }
                }
            }
            return undefined;
        }
        for(let key in this.functionalUnits) {
            var uf = this.functionalUnits[key];
            if (uf.unitType === typeFU) {
                if (!uf.busy) {
                    return uf;
                }
            }
        }
        return undefined;
    }

    getCycles(instruction) {
        switch (instruction.operation) {
            case 'ADDD':
                return parseInt(this.configuration.cycles['Add']);
            case 'SUBD':
                return parseInt(this.configuration.cycles['Add']);
            case 'MULTD':
                return parseInt(this.configuration.cycles['Mult']);
            case 'DIVD':
                return parseInt(this.configuration.cycles['Div']);
            case 'LD':
                return parseInt(this.configuration.cycles['Load']);
            case 'SD':
                return parseInt(this.configuration.cycles['Store']);
            case 'ADD':
                return parseInt(this.configuration.cycles['Integer']);
            case 'DADDUI':
                return parseInt(this.configuration.cycles['Integer']);
            case 'BEQ':
                return parseInt(this.configuration.cycles['Integer']);
            case 'BNEZ':
                return parseInt(this.configuration.cycles['Integer']);
        }
    }

    allocateFUMem(uf, instruction, instructionState) {
        uf.instruction = instruction;
        uf.instructionState = instructionState;
        uf.time = this.getCycles(instruction) + 1; 
        uf.busy = true;
        uf.operation = instruction.operation;
        uf.address = instruction.registerS + '+' + instruction.registerT;
        uf.destination = instruction.registerR;
        uf.qi = null;
        uf.qj = null;

        if (instruction.operation === 'SD') {
            let UFtoWait = this.registerStation[instruction.registerR];
            if ((UFtoWait in this.functionalUnits) || (UFtoWait in this.functionalUnitsMemory))
                uf.qi = UFtoWait;
            else
                uf.qi = null;
        }

        let UFIntToWait = this.registerStation[instruction.registerT];

        if ((UFIntToWait in this.functionalUnits) || (UFIntToWait in this.functionalUnitsMemory))
            uf.qj = UFIntToWait;
        else
            uf.qj = null;
    }

    writeStationRegister(instruction, ufName) {
        this.registerStation[instruction.registerR] = ufName;
    }

    allocateFU(uf, instruction, instructionState) {
        uf.instruction = instruction;
        uf.instructionState = instructionState;
        uf.time = this.getCycles(instruction) + 1; 
        uf.busy = true;
        uf.operation = instruction.operation;

        let reg_j;
        let reg_k;
        let reg_j_inst;
        let reg_k_inst;

        if ((instruction.operation === 'BNEZ') || (instruction.operation === 'BEQ')) {
            reg_j = this.registerStation[instruction.registerR];   
            reg_k = this.registerStation[instruction.registerS];   

            reg_j_inst = instruction.registerR;                         
            reg_k_inst = instruction.registerS;
        } else {
            reg_j = this.registerStation[instruction.registerS];   
            reg_k = this.registerStation[instruction.registerT];   

            reg_j_inst = instruction.registerS;                         
            reg_k_inst = instruction.registerT;
        }

        if (reg_j === null || reg_j === undefined)
            uf.vj = reg_j_inst;
        else {
            if ((reg_j in this.functionalUnits) || (reg_j in this.functionalUnitsMemory))
                uf.qj = reg_j;
            else
                uf.vj = reg_j;
        }

        if (reg_k === null || reg_k === undefined)
            uf.vk = reg_k_inst;
        else {
            
            if ((reg_k in this.functionalUnits) || (reg_k in this.functionalUnitsMemory))
                uf.qk = reg_k;
            else
                uf.vk = reg_k;
        }
    }


    releaseWaitingUF(UF) {
        for(let keyUF in this.functionalUnits) {
            const lookingUF = this.functionalUnits[keyUF];
            
           
            if ((lookingUF.busy === true) && 
               ((lookingUF.qj === UF.name) || 
               (lookingUF.qk === UF.name))) {

                
                if (lookingUF.qj === UF.name) {
                    lookingUF.vj = 'VAL(' + UF.name + ')';   
                    lookingUF.qj = null;                     
                }

                
                if (lookingUF.qk === UF.name) {
                    lookingUF.vk = 'VAL(' + UF.name + ')';   
                    lookingUF.qk = null;                     
                }

                
                if ((lookingUF.qj === null) && (lookingUF.qk === null)) {
                    lookingUF.time = lookingUF.time - 1; 
                }
            }
        }

       
        for(let keyUF in this.functionalUnitsMemory) {
            const lookingUF = this.functionalUnitsMemory[keyUF];
            
            
            if (lookingUF.busy === true) {
                
                if (lookingUF.qi === UF.name) {
                    lookingUF.qi = null;
                    lookingUF.time = lookingUF.time - 1;
                } else if (lookingUF.qj === UF.name) {
                    lookingUF.qj = null;
                    lookingUF.time = lookingUF.time - 1;
                }
            }
        }
    }

    deallocateUFMem(ufMem) {
  
        ufMem.instruction = null;
        ufMem.instructionState = null;
        ufMem.time = null;
        ufMem.busy = false;
        ufMem.operation = null;
        ufMem.address = null;
        ufMem.destination = null;
        ufMem.qi = null;
        ufMem.qj = null;
    }

    deallocateUF(uf) {
   
        uf.instruction = null;
        uf.instructionState = null;
        uf.time = null;
        uf.busy = false;
        uf.operation = null;
        uf.vj = null;
        uf.vk = null;
        uf.qj = null;
        uf.qk = null;
    }

    checkIfFinished() {
    
        let qtdNotFinishedInstruction = 0;
        for (let i = 0; i < this.instructionsState.length; i++) {
            const element = this.instructionsState[i];
            
            if (element.write === null)
                qtdNotFinishedInstruction++;
        }

        return qtdNotFinishedInstruction > 0 ? false : true;
    }

    issueNewInstruction() {
        let newInstruction = this.getNewInstruction();  

        if (newInstruction) {
            let instructionUF = this.verifyUFInstruction(newInstruction.instruction);  
            let toUseUF = this.getEmptyFU(instructionUF);                        

            if (toUseUF) {

                if ((toUseUF.unitType == 'Load') || (toUseUF.unitType == 'Store'))
                    this.allocateFUMem(toUseUF, newInstruction.instruction, newInstruction);
                else
                    this.allocateFU(toUseUF, newInstruction.instruction, newInstruction);

                newInstruction.issue = this.clock;

                if ((toUseUF.unitType !== 'Store') && (toUseUF.operation !== 'BEQ') && (toUseUF.operation !== 'BEQ'))
                    this.writeStationRegister(newInstruction.instruction, toUseUF.name);
            }
        }
    }

    executeInstruction() {

        for(let key in this.functionalUnitsMemory) {
            var ufMem = this.functionalUnitsMemory[key];

            if ((ufMem.busy === true) && (ufMem.qi === null) && (ufMem.qj === null)) {
                ufMem.time = ufMem.time - 1;   

                if (ufMem.time === 0) {
                    ufMem.instructionState.execute = this.clock;
                }
            }
        }


        for(let key in this.functionalUnits) {
            var uf = this.functionalUnits[key];

            if ((uf.busy === true) && (uf.vj !== null) && (uf.vk !== null)) {
                uf.time = uf.time - 1;   

                if (uf.time === 0) {
                    uf.instructionState.execute = this.clock;
                }
            }
        }
    }

    writeInstruction() {

        for(let key in this.functionalUnitsMemory) {
            const ufMem = this.functionalUnitsMemory[key];

            if (ufMem.busy === true) {
                if (ufMem.time === -1) {
                    ufMem.instructionState.write = this.clock;

                    let valueReg = this.registerStation[ufMem.instruction.registerR];

                    if (valueReg === ufMem.name) {
                        this.registerStation[ufMem.instruction.registerR] = 'VAL(' + ufMem.name + ')';
                    }

                    this.releaseWaitingUF(ufMem);
                    this.deallocateUFMem(ufMem);
                }
            }
        }

        for(let key in this.functionalUnits) {
            const uf = this.functionalUnits[key];

            if (uf.busy === true) {
                if (uf.time === -1) {
                    uf.instructionState.write = this.clock;   

                    let valueReg = this.registerStation[uf.instruction.registerR];

                    if (valueReg === uf.name) {
                        this.registerStation[uf.instruction.registerR] = 'VAL(' + uf.name + ')';
                    }

                    this.releaseWaitingUF(uf);
                    this.deallocateUF(uf);
                }
            }
        }
    }

    execute_cycle() {

        this.clock++;  

        this.issueNewInstruction();
        this.executeInstruction();
        this.writeInstruction();

        return this.checkIfFinished();
    }

}
