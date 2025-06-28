import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
  IonChip,
  IonBadge,
  IonGrid,
  IonAlert,
  useIonToast,
  IonSpinner
} from '@ionic/react';
import {
  checkmarkCircle,
  close,
  diamond,
  downloadOutline,
  documentTextOutline,
  starOutline,
  checkmark,
  lockClosedOutline
} from 'ionicons/icons';
import { purchaseService, PRODUCTS, Product, PurchaseState } from '../../services/PurchaseService';
import './Premium.css';

interface PremiumProps {
  isOpen: boolean;
  onClose: () => void;
}

const Premium: React.FC<PremiumProps> = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseState, setPurchaseState] = useState<PurchaseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [present] = useIonToast();

  useEffect(() => {
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    await purchaseService.initialize();
    setProducts(purchaseService.getProducts());
    setPurchaseState(purchaseService.getPurchaseState());
  };

  const handlePurchase = async (productId: string) => {
    setLoading(true);
    try {
      const success = await purchaseService.purchaseProduct(productId);
      if (success) {
        await present({
          message: 'Purchase successful! 🎉',
          duration: 2000,
          color: 'success'
        });
        setPurchaseState(purchaseService.getPurchaseState());
      } else {
        await present({
          message: 'Purchase failed. Please try again.',
          duration: 3000,
          color: 'danger'
        });
      }
    } catch (error) {
      await present({
        message: 'Purchase error. Please try again.',
        duration: 3000,
        color: 'danger'
      });
    }
    setLoading(false);
    setShowConfirm(false);
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await purchaseService.restorePurchases();
      await present({
        message: 'Purchases restored successfully!',
        duration: 2000,
        color: 'success'
      });
      setPurchaseState(purchaseService.getPurchaseState());
    } catch (error) {
      await present({
        message: 'Failed to restore purchases.',
        duration: 3000,
        color: 'danger'
      });
    }
    setLoading(false);
  };

  const confirmPurchase = (productId: string) => {
    setSelectedProduct(productId);
    setShowConfirm(true);
  };

  const getProductTitle = (id: string) => {
    switch (id) {
      case PRODUCTS.PREMIUM_MONTHLY:
        return 'Premium Monthly';
      case PRODUCTS.PREMIUM_YEARLY:
        return 'Premium Yearly';
      case PRODUCTS.UNLIMITED_EXPORTS:
        return 'Unlimited Exports';
      case PRODUCTS.ADVANCED_TEMPLATES:
        return 'Advanced Templates';
      default:
        return 'Premium Feature';
    }
  };

  const getProductDescription = (id: string) => {
    switch (id) {
      case PRODUCTS.PREMIUM_MONTHLY:
        return 'Access all premium features for 30 days';
      case PRODUCTS.PREMIUM_YEARLY:
        return 'Access all premium features for 365 days (Best Value!)';
      case PRODUCTS.UNLIMITED_EXPORTS:
        return 'Export unlimited invoices and reports';
      case PRODUCTS.ADVANCED_TEMPLATES:
        return 'Access to professional invoice templates';
      default:
        return 'Premium feature access';
    }
  };

  const getProductPrice = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) return product.price;
    
    // Fallback prices for test mode
    switch (id) {
      case PRODUCTS.PREMIUM_MONTHLY:
        return '$4.99';
      case PRODUCTS.PREMIUM_YEARLY:
        return '$49.99';
      case PRODUCTS.UNLIMITED_EXPORTS:
        return '$9.99';
      case PRODUCTS.ADVANCED_TEMPLATES:
        return '$7.99';
      default:
        return '$0.99';
    }
  };

  const isProductOwned = (id: string) => {
    if (!purchaseState) return false;
    
    switch (id) {
      case PRODUCTS.PREMIUM_MONTHLY:
      case PRODUCTS.PREMIUM_YEARLY:
        return purchaseState.isPremium;
      case PRODUCTS.UNLIMITED_EXPORTS:
        return purchaseState.hasUnlimitedExports || purchaseState.isPremium;
      case PRODUCTS.ADVANCED_TEMPLATES:
        return purchaseState.hasAdvancedTemplates || purchaseState.isPremium;
      default:
        return false;
    }
  };

  const PremiumFeature = ({ icon, title, description, owned }: {
    icon: string;
    title: string;
    description: string;
    owned: boolean;
  }) => (
    <IonItem className={`premium-feature ${owned ? 'owned' : ''}`}>
      <IonIcon 
        icon={owned ? checkmarkCircle : icon} 
        slot="start" 
        color={owned ? 'success' : 'primary'}
      />
      <IonLabel>
        <h3>{title}</h3>
        <p>{description}</p>
      </IonLabel>
      {owned && (
        <IonChip color="success" slot="end">
          <IonIcon icon={checkmark} />
          <IonLabel>Owned</IonLabel>
        </IonChip>
      )}
    </IonItem>
  );

  const ProductCard = ({ productId }: { productId: string }) => {
    const owned = isProductOwned(productId);
    const isYearly = productId === PRODUCTS.PREMIUM_YEARLY;
    
    return (
      <IonCard className={`product-card ${owned ? 'owned' : ''} ${isYearly ? 'popular' : ''}`}>
        {isYearly && (
          <IonBadge color="warning" className="popular-badge">
            <IonIcon icon={starOutline} /> Best Value
          </IonBadge>
        )}
        <IonCardHeader>        <IonCardTitle className="product-title">
          <IonIcon icon={diamond} />
          {getProductTitle(productId)}
        </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="price-container">
            <span className="price">{getProductPrice(productId)}</span>
            {productId.includes('yearly') && (
              <span className="price-note">Save 60%!</span>
            )}
          </div>
          <p className="product-description">
            {getProductDescription(productId)}
          </p>
          
          {owned ? (
            <IonButton expand="block" fill="outline" color="success" disabled>
              <IonIcon icon={checkmarkCircle} slot="start" />
              Purchased
            </IonButton>
          ) : (
            <IonButton 
              expand="block" 
              onClick={() => confirmPurchase(productId)}
              disabled={loading}
              className="purchase-button"
            >
              {loading ? <IonSpinner name="crescent" /> : 'Purchase'}
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Premium Features</IonTitle>
            <IonButton 
              slot="end" 
              fill="clear" 
              onClick={onClose}
            >
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="premium-content">
          {/* Current Status */}
          {purchaseState && (
            <IonCard className="status-card">
              <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={diamond} />
          Your Status
        </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <div className="status-item">
                        <IonText color={purchaseState.isPremium ? 'success' : 'medium'}>
                          <h3>Premium</h3>
                          <p>{purchaseState.isPremium ? 'Active' : 'Inactive'}</p>
                        </IonText>
                      </div>
                    </IonCol>
                    <IonCol size="6">
                      <div className="status-item">
                        <IonText color="primary">
                          <h3>Exports</h3>
                          <p>
                            {purchaseState.hasUnlimitedExports || purchaseState.isPremium 
                              ? 'Unlimited' 
                              : `${purchaseState.exportsUsed}/${purchaseState.maxExports}`
                            }
                          </p>
                        </IonText>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>
          )}

          {/* Features List */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Premium Features</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <PremiumFeature
                  icon={downloadOutline}
                  title="Unlimited Exports"
                  description="Export unlimited invoices, PDFs, and Excel files"
                  owned={purchaseState?.hasUnlimitedExports || purchaseState?.isPremium || false}
                />
                <PremiumFeature
                  icon={documentTextOutline}
                  title="Advanced Templates"
                  description="Access professional invoice templates and customization"
                  owned={purchaseState?.hasAdvancedTemplates || purchaseState?.isPremium || false}
                />
                <PremiumFeature
                  icon={lockClosedOutline}
                  title="Priority Support"
                  description="Get priority customer support and feature requests"
                  owned={purchaseState?.isPremium || false}
                />
              </IonList>
            </IonCardContent>
          </IonCard>

          {/* Products */}
          <div className="products-container">
            <h2>Choose Your Plan</h2>
            <IonGrid>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <ProductCard productId={PRODUCTS.PREMIUM_MONTHLY} />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <ProductCard productId={PRODUCTS.PREMIUM_YEARLY} />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="12" sizeMd="6">
                  <ProductCard productId={PRODUCTS.UNLIMITED_EXPORTS} />
                </IonCol>
                <IonCol size="12" sizeMd="6">
                  <ProductCard productId={PRODUCTS.ADVANCED_TEMPLATES} />
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>

          {/* Restore Purchases */}
          <div className="restore-container">
            <IonButton 
              fill="clear" 
              onClick={handleRestore}
              disabled={loading}
            >
              Restore Purchases
            </IonButton>
          </div>
        </IonContent>

        {/* Purchase Confirmation */}
        <IonAlert
          isOpen={showConfirm}
          onDidDismiss={() => setShowConfirm(false)}
          header="Confirm Purchase"
          message={`Purchase ${getProductTitle(selectedProduct)} for ${getProductPrice(selectedProduct)}?`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Purchase',
              handler: () => handlePurchase(selectedProduct)
            }
          ]}
        />
      </IonPage>
    </IonModal>
  );
};

export default Premium;
