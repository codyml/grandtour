import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import moduleName from './app.module.ajs';
import { GridComponent } from './grid.component';
import { NgDatasheetModule } from 'ngdatasheet/ngdatasheet';

@NgModule({
    imports: [
        // NgDatasheetModule,
        BrowserModule,
        UpgradeModule
    ],
    declarations: [
        GridComponent
    ],
    entryComponents: [
        GridComponent
    ]
})
export class AppModule {
    constructor(private upgrade: UpgradeModule){
    }
    ngDoBootstrap(){
        this.upgrade.bootstrap(document.documentElement as Element, [moduleName], {strictDi: true});
    }
}