import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';

import ApDashboard from './components/ApDashboard';
import { IApDashboardProps } from './components/IApDashboardProps';
import { initDataService } from './spDataService';

export interface IApDashboardWebPartProps {
  dataFolder: string;
}

export default class ApDashboardWebPart extends BaseClientSideWebPart<IApDashboardWebPartProps> {

  public render(): void {
    const webAbsoluteUrl = this.context.pageContext.web.absoluteUrl;
    const webServerRelativeUrl = this.context.pageContext.web.serverRelativeUrl;
    const dataFolder = this.properties.dataFolder || 'Shared Documents/AP Dashboard Data';

    // Initialise the singleton data service with SPFx context
    initDataService(
      this.context.spHttpClient,
      webAbsoluteUrl,
      webServerRelativeUrl,
      dataFolder,
    );

    const element: React.ReactElement<IApDashboardProps> = React.createElement(
      ApDashboard,
      {
        webAbsoluteUrl,
        dataFolder,
      },
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'AP Dashboard Settings' },
          groups: [
            {
              groupName: 'Data Storage',
              groupFields: [
                PropertyPaneTextField('dataFolder', {
                  label: 'Data folder (server-relative path within this site)',
                  description: 'e.g. Shared Documents/AP Dashboard Data',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
