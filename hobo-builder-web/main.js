/**
 * Documentation to come later lol...
 */

class PriceEntry {
        name = "";
        count = 0;
        unit_price = 0;

        totalPrice() {
                return this.count * this.unit_price;
        }
}

class List {
        // Core fields
        name;
        maxCards;
        minCards;
        budget;
        entries = [];
        DOM = [];

        currentCards() {
                let c = 0;
                for (const entry of this.entries) {
                        c += Number(entry.count);
                }
                return c;
        }

        currentPrice() {
                let p = 0;
                for (const entry of this.entries) {
                        p += entry.totalPrice();
                }
                return p;
        }

        // Constructor accepts a name and automatically assigns the correct
        // budget and min/max card numbers.
        constructor(name) {
                this.name = name;
                switch (name) {
                        case "deck":
                                this.maxCards = Infinity;
                                this.minCards = 60;
                                this.budget = 20;
                                break;
                        case "sideboard":
                                this.maxCards = 15;
                                this.minCards = 0;
                                this.budget = 5;
                                break;
                }
        }

        // Returns an array of up to three strings to be inserted into the
        // DOM at the appropriate location. Because this structure is unaware
        // of the text of cards or the rules of the game, it cannot make a full
        // judgement on the legality of the deck. It simply warns the user if
        // the number of cards listed is outside of permissible bounds or the
        // budget is too high.
        getWarnings() {
                let warnings = [];
                
                if (this.currentCards() > this.maxCards) {
                        warnings.push(`Your ${this.name} has too many cards.`);
                }
                
                if (this.currentCards() < this.minCards) {
                        warnings.push(`Your ${this.name} has too few cards.`);
                }

                if (this.currentPrice() > this.budget) {
                        warnings.push(`Your ${this.name} is too expensive.`);
                }

                return warnings;
        }

        // Returns the value property of the card name input.
        getNameInput(index) {
                return this.DOM[index].childNodes[0].childNodes[1].value;
        }

        // Returns the value property of the card count input.
        getCountInput(index) {
                return this.DOM[index].childNodes[0].childNodes[0].value;
        }

        // Updates the internal storage and DOM caption of an entry when the
        // user input changes.
        updateEntry(index) {
                const name = this.getNameInput(index);
                const count = this.getCountInput(index);
                const unit_price = Price.get(name);

                this.entries[index].name = name;
                this.entries[index].count = count;
                this.entries[index].unit_price = unit_price;

                let caption;
                if (unit_price >= 0) {
                        caption = this.getPriceLine(index);
                } else {
                        caption = `Card name ${name} not recognized.`; 
                }
                
                this.DOM[index].childNodes[1].textContent = caption;
                this.updateHeader();
        }

        // Returns the line of text that is displayed under the input box that
        // provides information on the price of the selected card.
        // TODO: actually implement
        getPriceLine(index) {
                const unit_price = this.entries[index].unit_price.toFixed(2);
                const total_price = this.entries[index].totalPrice();
                const padding = "\u00a0\u00a0\u00a0\u00a0";
                const string = `${this.entries[index].count} \u00d7 \
                        $${unit_price} = $${total_price.toFixed(2)} \
                        ${padding} \u2014 ${padding} ${(
                                100 * total_price / this.budget
                        ).toFixed(2)}% of budget.`;
                return string;
        }

        // TODO: add eventListeners
        addEntry() {
                const index = this.entries.length;

                // Add a new entry to the internal list representation.
                this.entries.push(new PriceEntry);

                // Muck about with the DOM.
                // First create an "entry" class div and then attach the two
                // form lines to it before adding it to the DOM. A bit ugly but
                // it works.
                let entry = document.createElement("div");
                entry.classList.add("entry");

                // Now we create the first row...
                let form_row = document.createElement("div");
                form_row.classList.add("form_row", this.name);
                entry.appendChild(form_row);

                // Card count input...
                let card_count_input = document.createElement("input");
                card_count_input.type = "number";
                card_count_input.min = "0";
                card_count_input.classList.add("card_count_input");
                card_count_input.setAttribute("value", 0);
                card_count_input.setAttribute(
                        "onchange",
                        `${this.name}.updateEntry(${index})`
                );
                form_row.appendChild(card_count_input);

                // Card name input...
                let card_name_input = document.createElement("input");
                card_name_input.type = "text";
                card_name_input.classList.add("card_name_input");
                card_name_input.setAttribute("list", "card_names");
                card_name_input.placeholder = "Card name...";
                // onchange
                card_name_input.setAttribute(
                        "onchange",
                        `${this.name}.updateEntry(${index})`
                );
                form_row.appendChild(card_name_input);

                // Card delete button...
                let card_del_button = document.createElement("button");
                card_del_button.type = "button";
                card_del_button.classList.add("card_del_button");
                card_del_button.textContent = "Remove Card";
                card_del_button.setAttribute(
                        "onclick",
                        `${this.name}.removeEntry(${index})`
                );
                form_row.appendChild(card_del_button);

                // Card caption line...
                let card_caption = document.createElement("div");
                card_caption.classList.add("card_caption");
                card_caption.textContent = "\u00a0";
                entry.appendChild(card_caption);

                // Add to internal DOM list for easy access.
                this.DOM.push(entry);

                // Add to document just before the Add Card button.
                document.querySelector(
                        `div.${this.name}.add_button`
                ).before(entry);
        }

        // Removes a price entry from both memory and the DOM.
        // Thanks to sparse arrays we don't have to do any extra work.
        removeEntry(index) {
                delete this.entries[index];
                
                this.DOM[index].remove();
                delete this.DOM[index];
        }

        updateHeader() {
                document.querySelector(
                        `sup.count.${this.name}`
                ).innerText = this.currentCards();

                document.querySelector(
                        `sup.price.${this.name}`
                ).innerText = `$${this.currentPrice().toFixed(2)}`;
        }
}

// Shamelessly stolen from mdn web docs...
async function getData() {
        const url = "./data/2025-05-20_basic.json";
        try {
                const response = await fetch(url);
                if (!response.ok) {
                        throw new Error(`Response status: ${response.status}`);
                }

                const json = await response.json();
                return json;
        } catch (error) {
                console.error(error.message);
        }
}

class Price {
        static data; // will be assigned at runtime

        // Returns the price of the card with the specified name, or -1 if
        // there is no card with that name. Since the array is already sorted
        // based on the name field, this can probably be optimized...
        static get(name) {
                const i = this.data.findIndex((e) => e["name"] === name);
                if (i === -1) {
                        return -1;
                }
                return Number(this.data[i]["usd"]);
        }

        static populateDatalist() {
                let datalist = document.querySelector("datalist");
                for (const entry of this.data) {
                        let option = document.createElement("option");
                        option.setAttribute("value", entry["name"]);
                        datalist.appendChild(option);
                }
        }
}

// ---- RUNTIME SCRIPT BEGINS HERE ----

window.deck = new List("deck");
window.sideboard = new List("sideboard");
window.Price = Price;

Price.data = await getData();
Price.populateDatalist();
