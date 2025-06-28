import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
  IonBadge,
  useIonAlert,
  useIonToast,
} from "@ionic/react";
import { APP_NAME, DATA } from "../app-data";
import * as AppGeneral from "../components/socialcalc/index.js";
import { useEffect, useState } from "react";
import { Local } from "../components/Storage/LocalStorage";
import { menu, settings, diamond } from "ionicons/icons";
import "./Home.css";
import Menu from "../components/Menu/Menu";
import Files from "../components/Files/Files";
import NewFile from "../components/NewFile/NewFile";
import Premium from "../components/Premium/Premium";
import { purchaseService } from "../services/PurchaseService";
import { ExportService } from "../services/ExportService";

const Home: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPopover, setShowPopover] = useState<{
    open: boolean;
    event: Event | undefined;
  }>({ open: false, event: undefined });
  const [selectedFile, updateSelectedFile] = useState("default");
  const [billType, updateBillType] = useState(1);
  const [showPremium, setShowPremium] = useState(false);
  const [purchaseState, setPurchaseState] = useState<any>(null);
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();
  const [device] = useState("default");

  const store = new Local();

  const closeMenu = () => {
    setShowMenu(false);
  };

  const activateFooter = (footer) => {
    AppGeneral.activateFooterButton(footer);
  };

  useEffect(() => {
    const data = DATA["home"][device]["msc"];
    AppGeneral.initializeApp(JSON.stringify(data));
    
    // Initialize purchase service
    initializePurchases();
  }, []);

  useEffect(() => {
    activateFooter(billType);
  }, [billType]);

  const initializePurchases = async () => {
    await purchaseService.initialize();
    setPurchaseState(purchaseService.getPurchaseState());
  };

  // Handle export with premium check
  const handleExport = async (exportType: 'pdf' | 'csv') => {
    const { canExport, message } = await ExportService.canExport();
    
    if (!canExport) {
      presentAlert({
        header: 'Export Limit Reached',
        message: message || 'Upgrade to Premium for unlimited exports.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Upgrade',
            handler: () => setShowPremium(true)
          }
        ]
      });
      return;
    }

    try {
      let result;
      if (exportType === 'pdf') {
        result = await ExportService.exportToPDF();
      } else {
        result = await ExportService.exportToCSV();
      }
      
      if (result.success) {
        presentToast({
          message: `${exportType.toUpperCase()} exported successfully!`,
          duration: 2000,
          color: 'success'
        });
        // Refresh purchase state to show updated export count
        setPurchaseState(purchaseService.getPurchaseState());
      } else {
        presentToast({
          message: result.message,
          duration: 3000,
          color: 'danger'
        });
      }
    } catch (error) {
      presentToast({
        message: 'Export failed. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    }
  };

  const footers = DATA["home"][device]["footers"];
  const footersList = footers.map((footerArray) => {
    return (
      <IonButton
        key={footerArray.index}
        expand="full"
        color="light"
        className="ion-no-margin"
        onClick={() => {
          updateBillType(footerArray.index);
          activateFooter(footerArray.index);
          setShowPopover({ open: false, event: undefined });
        }}
      >
        {footerArray.name}
      </IonButton>
    );
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{APP_NAME}</IonTitle>
          {/* Premium Button */}
          <IonButton 
            slot="end" 
            fill="clear" 
            onClick={() => setShowPremium(true)}
            className="premium-button"
          >
            <IonIcon icon={diamond} />
            {purchaseState && !purchaseState.isPremium && (
              <IonBadge color="warning" className="export-counter">
                {purchaseState.hasUnlimitedExports ? '∞' : `${purchaseState.maxExports - purchaseState.exportsUsed}`}
              </IonBadge>
            )}
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonToolbar color="primary">
          <IonIcon
            icon={settings}
            slot="end"
            className="ion-padding-end"
            size="large"
            onClick={(e) => {
              setShowPopover({ open: true, event: e.nativeEvent });
              console.log("Popover clicked");
            }}
          />
          <Files
            store={store}
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            updateBillType={updateBillType}
          />

          <NewFile
            file={selectedFile}
            updateSelectedFile={updateSelectedFile}
            store={store}
            billType={billType}
          />
          <IonPopover
            animated
            keyboardClose
            backdropDismiss
            event={showPopover.event}
            isOpen={showPopover.open}
            onDidDismiss={() =>
              setShowPopover({ open: false, event: undefined })
            }
          >
            {footersList}
          </IonPopover>
        </IonToolbar>
        <IonToolbar color="secondary">
          <IonTitle className="ion-text-center">
            Editing : {selectedFile}
          </IonTitle>
        </IonToolbar>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton type="button" onClick={() => setShowMenu(true)}>
            <IonIcon icon={menu} />
          </IonFabButton>
        </IonFab>

        <Menu
          showM={showMenu}
          setM={closeMenu}
          file={selectedFile}
          updateSelectedFile={updateSelectedFile}
          store={store}
          bT={billType}
        />

        <div id="container">
          <div id="workbookControl"></div>
          <div id="tableeditor"></div>
          <div id="msg"></div>
        </div>

        {/* Premium Modal */}
        <Premium 
          isOpen={showPremium} 
          onClose={() => {
            setShowPremium(false);
            // Refresh purchase state when modal closes
            initializePurchases();
          }} 
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
