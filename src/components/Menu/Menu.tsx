import React, { useState } from "react";
import * as AppGeneral from "../socialcalc/index.js";
import { File, Local } from "../Storage/LocalStorage";
import { isPlatform, IonToast } from "@ionic/react";
import { EmailComposer } from "capacitor-email-composer";
import { IonActionSheet, IonAlert } from "@ionic/react";
import { saveOutline, save, mail, print, documentTextOutline, documentOutline } from "ionicons/icons";
import { APP_NAME } from "../../app-data.js";
import { ExportService } from "../../services/ExportService";

const Menu: React.FC<{
  showM: boolean;
  setM: Function;
  file: string;
  updateSelectedFile: Function;
  store: Local;
  bT: number;
}> = (props) => {  const [showAlert1, setShowAlert1] = useState(false);
  const [showAlert2, setShowAlert2] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showAlert5, setShowAlert5] = useState(false); // PDF export alert
  const [showAlert6, setShowAlert6] = useState(false); // CSV export alert
  const [showToast1, setShowToast1] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  /* Utility functions */
  const _validateName = async (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage("Cannot update default file!");
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (await props.store._checkKey(filename)) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  const getCurrentFileName = () => {
    return props.file;
  };

  const _formatString = (filename) => {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };
  const doPrint = () => {
    if (isPlatform("hybrid")) {
      // For mobile devices, we'll use PDF export and let the user print from there
      setToastMessage("Please use 'Export PDF' to generate a printable file");
      setShowToast1(true);
    } else {
      const content = AppGeneral.getCurrentHTMLContent();
      const printWindow = window.open("", "Print Invoice", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
                @media print {
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              ${content}
              <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">Print</button>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };
  const doSave = () => {
    if (props.file === "default") {
      setShowAlert1(true);
      return;
    }
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    const data = props.store._getFile(props.file);
    const file = new File(
      (data as any).created,
      new Date().toString(),
      content,
      props.file,
      props.bT
    );
    props.store._saveFile(file);
    props.updateSelectedFile(props.file);
    setShowAlert2(true);
  };

  const doSaveAs = async (filename) => {
    // event.preventDefault();
    if (filename) {
      // console.log(filename, _validateName(filename));
      if (await _validateName(filename)) {
        // filename valid . go on save
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        // console.log(content);
        const file = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename,
          props.bT
        );
        // const data = { created: file.created, modified: file.modified, content: file.content, password: file.password };
        // console.log(JSON.stringify(data));
        props.store._saveFile(file);
        props.updateSelectedFile(filename);
        setShowAlert4(true);
      } else {
        setShowToast1(true);
      }
    }
  };
  const sendEmail = () => {
    if (isPlatform("hybrid")) {
      const content = AppGeneral.getCurrentHTMLContent();
      const base64 = btoa(content);

      EmailComposer.open({
        to: ["jackdwell08@gmail.com"],
        cc: [],
        bcc: [],
        body: "PFA",
        attachments: [{ type: "base64", path: base64, name: "Invoice.html" }],
        subject: `${APP_NAME} attached`,
        isHtml: true,
      });
    } else {
      alert("This Functionality works on Anroid/IOS devices");
    }
  };
  const exportToPDF = async () => {
    try {
      const fileName = props.file === "default" ? "invoice" : props.file;
      const result = await ExportService.exportToPDF(fileName);
      
      if (result.success) {
        setToastMessage(result.message);
        setShowAlert5(true);
      } else {
        setToastMessage(result.message);
        setShowToast1(true);
      }
    } catch (error) {
      setToastMessage("Failed to export PDF: " + error.message);
      setShowToast1(true);
    }
  };

  const exportToCSV = async () => {
    try {
      const fileName = props.file === "default" ? "invoice" : props.file;
      const result = await ExportService.exportToCSV(fileName);
      
      if (result.success) {
        setToastMessage(result.message);
        setShowAlert6(true);
      } else {
        setToastMessage(result.message);
        setShowToast1(true);
      }
    } catch (error) {
      setToastMessage("Failed to export CSV: " + error.message);
      setShowToast1(true);
    }
  };

  return (
    <React.Fragment>
      <IonActionSheet
        animated
        keyboardClose
        isOpen={props.showM}
        onDidDismiss={() => props.setM()}        buttons={[
          {
            text: "Save",
            icon: saveOutline,
            handler: () => {
              doSave();
              console.log("Save clicked");
            },
          },
          {
            text: "Save As",
            icon: save,
            handler: () => {
              setShowAlert3(true);
              console.log("Save As clicked");
            },
          },
          {
            text: "Export PDF",
            icon: documentOutline,
            handler: () => {
              exportToPDF();
              console.log("Export PDF clicked");
            },
          },
          {
            text: "Export CSV",
            icon: documentTextOutline,
            handler: () => {
              exportToCSV();
              console.log("Export CSV clicked");
            },
          },
          {
            text: "Print",
            icon: print,
            handler: () => {
              doPrint();
              console.log("Print clicked");
            },
          },
          {
            text: "Email",
            icon: mail,
            handler: () => {
              sendEmail();
              console.log("Email clicked");
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Alert Message"
        message={
          "Cannot update <strong>" + getCurrentFileName() + "</strong> file!"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert2}
        onDidDismiss={() => setShowAlert2(false)}
        header="Save"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> updated successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert3}
        onDidDismiss={() => setShowAlert3(false)}
        header="Save As"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: (alertData) => {
              doSaveAs(alertData.filename);
            },
          },
        ]}
      />      <IonAlert
        animated
        isOpen={showAlert4}
        onDidDismiss={() => setShowAlert4(false)}
        header="Save As"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> saved successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert5}
        onDidDismiss={() => setShowAlert5(false)}
        header="PDF Export"
        message={toastMessage}
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert6}
        onDidDismiss={() => setShowAlert6(false)}
        header="CSV Export"
        message={toastMessage}
        buttons={["Ok"]}
      />
      <IonToast
        animated
        isOpen={showToast1}
        onDidDismiss={() => {
          setShowToast1(false);
          setShowAlert3(true);
        }}
        position="bottom"
        message={toastMessage}
        duration={2000}
      />
    </React.Fragment>
  );
};

export default Menu;
