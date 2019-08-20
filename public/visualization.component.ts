/*
 * Based on designs by Ashwin Ramaswami and Cody Leff. This file handles the "View" feature of the website. The Dots feature displays entries
 * as dots, allowing one to color, size, and group them according to certain properties. The Map feature will display a map of Italy with
 * locations of tours.
 */

import d3 from "d3";
import { Component, ViewChild, TemplateRef } from '@angular/core';
import { ElementRef, Renderer2 } from '@angular/core';
import '@swimlane/ngx-datatable/release/index.css';
import '@swimlane/ngx-datatable/release/themes/material.css';
import '@swimlane/ngx-datatable/release/assets/icons.css';
import { find, values } from "lodash";
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { HttpClient } from '@angular/common/http';

const BUFFER = 5;

/*
 * Handles the View "page", and its HTML and some styles.
 */
@Component({
    selector: 'visualization',
    template: `

    <div class='container' style='height: 100%'>
        <div class='viz-btn-group' style='margin:10px 0px'>
            <button>Dots</button>
            <button>Map</button>
        </div>

        <div class='viz-box'>
            <div class='dimension'>
                <p>COLOR</p>
                <select id="color" (change)="update()">
                    <option value="none">None</option>
                    <option value="gender">Gender</option>
                    <option value="new">Creation</option>
                </select>
            </div>
            <div class='dimension'>
                <p>SIZE</p>
                <select id="size" (change)="update()">
                    <option value="none">None</option>
                    <option value="length">Entry length</option>
                    <option value="travelTime">Travel length</option>
                </select>
            </div>
            <div class='dimension'>
                <p>GROUP</p>
                <select id="group" (change)="update()">
                    <option value="none">None</option>
                    <option value="travel">Date of first travel</option>
                    <option value="gender">Gender</option>
                    <option value="tours">Number of tours</option>
                </select>
            </div>
            
            <svg width="100%" height="1250px" class="mySvg" (click)="clicked($event)"></svg>
        </div>
    </div>
    `,
    styles: [`
    .mySvg {
        display: inline-block;
        background-color: white;
        border-top: 1px solid #dddddd;
        border-bottom-right-radius: 2px;
        border-bottom-left-radius: 2px;
    }
    `]
})

/*
 * This class handles the functionality of the visualization.
 */
export class VisualizationComponent {

    constructor(private http: HttpClient) {
        this.draw("none", "none", "none"); // on startup, all dots are displayed without any filters
    }

    /*
     * Called when a select element is changed. All values are collected and the svg is updated.
     */
    update() {
        var colorSelect = document.getElementById("color") as HTMLSelectElement;
        var colorBy = colorSelect.options[colorSelect.selectedIndex].value;

        var sizeSelect = document.getElementById("size") as HTMLSelectElement;
        var sizeBy = sizeSelect.options[sizeSelect.selectedIndex].value;

        var groupSelect = document.getElementById("group") as HTMLSelectElement;
        var groupBy = groupSelect.options[groupSelect.selectedIndex].value;

        this.draw(colorBy, sizeBy, groupBy);
    }

    clear() {
        d3.selectAll("svg > *").remove();
    }


    /*
     * For all groups, their label and dots are displayed.
     */
    async draw(colorBy, sizeBy, groupBy) {
        var allGroups = await this.getGroups(groupBy); // specifies group titles and their queries
        var entryGroups = await this.groupByType(allGroups); // groups entries according to appropriate queries

        this.clear();
        let x = 1;
        let y = 12;
        for (let i in entryGroups) {
            const group = allGroups[i];
            const entriesInGroup = (entryGroups[i] as { entries: any[], request: any }).entries;

            d3.select('svg').append("text")
                .attr("x", x)
                .attr("y", y)
                .text(function (d) { return group.title; });
            y += 15;

            let dotGroup = this.drawDots(entriesInGroup, colorBy, sizeBy, y);
            y = dotGroup + 50;
        }
    }

    /*
     * When given the entries of a group and how the dots should be sized and colored, dots are drawn accordingly. A y variable is stored to
     * properly locate the next group.
     */
    drawDots(entries, colorBy, sizeBy, y) {
        let x = BUFFER;

        let div = d3.select("body").append("div")
            .attr("class", "tool_tip")
            .style("opacity", 0)
        let width = d3.select("svg")[0][0].clientWidth;

        for (let i in entries) {
            let entry = entries[i];
            if (x > width - BUFFER) {
                x = BUFFER;
                y += 10;
            }

            var myColor;
            if (colorBy === "gender") {
                switch (entry.gender) {
                    case "Male":
                        myColor = "cornflowerblue";
                        break;
                    case "Female":
                        myColor = "indianred";
                        break;
                    default:
                        myColor = "darkslategray";
                }
            } else if (colorBy === "new") {
                switch (Number.isInteger(entry.index)) {
                    case true:
                        myColor = "indigo";
                        break;
                    case false:
                        myColor = "coral";
                        break;
                    default:
                        myColor = "darkslategray";
                }
            } 

            var mySize;
            if (sizeBy === "length") {
                mySize = Math.max(2, entry.entryLength * .001);
            } else if (sizeBy === "travelTime") {
                mySize = Math.max(2, entry.travelTime * .02);
            } else {
                mySize = 3;
            }
            // todo: hover boundary of 2px
            d3.select('svg').append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', mySize)
                .attr('fill', myColor)
                .style("opacity", 0.75)
                // we define "mouseover" handler, here we change tooltip
                // visibility to "visible" and add appropriate test

                .on("mouseover", function (d) {
                    div.transition()
                        .style("opacity", .9)
                    div.text(entry.fullName)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px")
                        .style("opacity", .9)
                    }
                )
                .on("mouseout", function (d) {
                    div.transition()
                        .style("opacity", 0);
                    }
                )
                .on("click", function() {
                    div.style("opacity", 0);
                    window.location.hash = `/entries/${entry.index}`;
                    }
                );
            x += 10;
        }
        return y; // Position for end of the dot group is returned to position next dot group.
    }

    /*
     * Using queries from getGroups, all entries are mapped to the appropriate group and returned.
     */
    private async groupByType(allGroups) {
        let entryGroups;
        try {
            entryGroups = await Promise.all(allGroups.map(group =>
                this.http.post('/api/entries/search', { query: group.query }).toPromise()
            ));
        }
        catch (e) {
            console.error(e);
            alert("There was an error loading the visualization requested.");
            return;
        }
        return entryGroups;
    }

    /*
     * The groupBy value is used to return a mapping of groups and their titles.
     */
    private async getGroups(groupBy) {
        const mapping = {
            "none": [
                {   
                    random: true, 
                    query: {},
                    title: ""
                }
            ],
            "travel": [
                {
                    query: { travelDate: { startYear: "0", endYear: "1699" } },
                    title: "Before 1700"
                },
                {
                    query: { travelDate: { startYear: "1700", endYear: "1709" } },
                    title: "1700-1709"
                },
                {
                    query: { travelDate: { startYear: "1710", endYear: "1719" } },
                    title: "1710-1719"
                },
                {
                    query: { travelDate: { startYear: "1720", endYear: "1729" } },
                    title: "1720-1729"
                },
                {
                    query: { travelDate: { startYear: "1730", endYear: "1739" } },
                    title: "1730-1739"
                },
                {
                    query: { travelDate: { startYear: "1740", endYear: "1749" } },
                    title: "1740-1749"
                },
                {
                    query: { travelDate: { startYear: "1750", endYear: "1759" } },
                    title: "1750-1759"
                },
                {
                    query: { travelDate: { startYear: "1760", endYear: "9999" } },
                    title: "1760 and after"
                }
            ],
            "gender": [
                {
                    query: { type: "Male" },
                    title: "Male"
                },
                {
                    query: { type: "Female" },
                    title: "Female"
                },
                {
                    query: { type: "" },
                    title: "Unknown"
                }
            ],
            "tours": [

            ]
        }
        return mapping[groupBy];
    }

    clicked(event) {
        console.log(event);
    }
}