import { Preferences } from '@capacitor/preferences';

// Define product IDs
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
  UNLIMITED_EXPORTS: 'unlimited_exports',
  ADVANCED_TEMPLATES: 'advanced_templates'
};

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  type: 'subscription' | 'consumable' | 'non-consumable';
}

export interface PurchaseState {
  isPremium: boolean;
  hasUnlimitedExports: boolean;
  hasAdvancedTemplates: boolean;
  exportsUsed: number;
  maxExports: number;
  subscriptionExpiry?: Date;
}

declare global {
  interface Window {
    store: any;
  }
}

class PurchaseService {
  private isInitialized = false;
  private products: Product[] = [];
  private purchaseState: PurchaseState = {
    isPremium: false,
    hasUnlimitedExports: false,
    hasAdvancedTemplates: false,
    exportsUsed: 0,
    maxExports: 5
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load saved purchase state
      await this.loadPurchaseState();

      // Initialize store if available (Cordova plugin)
      if (window.store) {
        this.setupStore();
      } else {
        console.log('IAP: Store not available, running in test mode');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PurchaseService:', error);
    }
  }

  private setupStore(): void {
    const { store } = window;

    // Register products
    store.register([
      {
        id: PRODUCTS.PREMIUM_MONTHLY,
        type: store.PAID_SUBSCRIPTION
      },
      {
        id: PRODUCTS.PREMIUM_YEARLY,
        type: store.PAID_SUBSCRIPTION
      },
      {
        id: PRODUCTS.UNLIMITED_EXPORTS,
        type: store.NON_CONSUMABLE
      },
      {
        id: PRODUCTS.ADVANCED_TEMPLATES,
        type: store.NON_CONSUMABLE
      }
    ]);

    // Set up event handlers
    store.when('product').loaded((product: any) => {
      this.products.push({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        type: this.getProductType(product.type)
      });
    });

    store.when('product').approved((product: any) => {
      this.handlePurchaseApproved(product);
      product.finish();
    });

    store.when('product').error((error: any) => {
      console.error('IAP Error:', error);
    });

    // Start the store
    store.refresh();
  }

  private getProductType(storeType: number): 'subscription' | 'consumable' | 'non-consumable' {
    const { store } = window;
    if (storeType === store.PAID_SUBSCRIPTION) return 'subscription';
    if (storeType === store.CONSUMABLE) return 'consumable';
    return 'non-consumable';
  }

  private async handlePurchaseApproved(product: any): Promise<void> {
    console.log('Purchase approved:', product.id);

    switch (product.id) {
      case PRODUCTS.PREMIUM_MONTHLY:
        this.purchaseState.isPremium = true;
        this.purchaseState.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case PRODUCTS.PREMIUM_YEARLY:
        this.purchaseState.isPremium = true;
        this.purchaseState.subscriptionExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        break;
      case PRODUCTS.UNLIMITED_EXPORTS:
        this.purchaseState.hasUnlimitedExports = true;
        this.purchaseState.maxExports = -1; // Unlimited
        break;
      case PRODUCTS.ADVANCED_TEMPLATES:
        this.purchaseState.hasAdvancedTemplates = true;
        break;
    }

    await this.savePurchaseState();
  }

  async purchaseProduct(productId: string): Promise<boolean> {
    try {
      if (!window.store) {
        // Test mode - simulate purchase
        console.log('Test mode: Simulating purchase of', productId);
        await this.handlePurchaseApproved({ id: productId });
        return true;
      }

      const product = window.store.get(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      window.store.order(productId);
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<void> {
    try {
      if (window.store) {
        window.store.refresh();
      }
    } catch (error) {
      console.error('Restore purchases failed:', error);
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  getPurchaseState(): PurchaseState {
    return { ...this.purchaseState };
  }

  canUseFeature(feature: string): boolean {
    switch (feature) {
      case 'unlimited_exports':
        return this.purchaseState.hasUnlimitedExports || this.purchaseState.isPremium;
      case 'advanced_templates':
        return this.purchaseState.hasAdvancedTemplates || this.purchaseState.isPremium;
      case 'export':
        if (this.purchaseState.hasUnlimitedExports || this.purchaseState.isPremium) {
          return true;
        }
        return this.purchaseState.exportsUsed < this.purchaseState.maxExports;
      default:
        return false;
    }
  }

  async useExport(): Promise<boolean> {
    if (this.canUseFeature('export')) {
      if (!this.purchaseState.hasUnlimitedExports && !this.purchaseState.isPremium) {
        this.purchaseState.exportsUsed++;
        await this.savePurchaseState();
      }
      return true;
    }
    return false;
  }

  getRemainingExports(): number {
    if (this.purchaseState.hasUnlimitedExports || this.purchaseState.isPremium) {
      return -1; // Unlimited
    }
    return Math.max(0, this.purchaseState.maxExports - this.purchaseState.exportsUsed);
  }

  private async savePurchaseState(): Promise<void> {
    try {
      await Preferences.set({
        key: 'purchaseState',
        value: JSON.stringify(this.purchaseState)
      });
    } catch (error) {
      console.error('Failed to save purchase state:', error);
    }
  }

  private async loadPurchaseState(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'purchaseState' });
      if (value) {
        const saved = JSON.parse(value);
        this.purchaseState = {
          ...this.purchaseState,
          ...saved,
          subscriptionExpiry: saved.subscriptionExpiry ? new Date(saved.subscriptionExpiry) : undefined
        };

        // Check if subscription is still valid
        if (this.purchaseState.subscriptionExpiry && new Date() > this.purchaseState.subscriptionExpiry) {
          this.purchaseState.isPremium = false;
          this.purchaseState.subscriptionExpiry = undefined;
          await this.savePurchaseState();
        }
      }
    } catch (error) {
      console.error('Failed to load purchase state:', error);
    }
  }

  // Test mode methods for development
  async enableTestMode(): Promise<void> {
    this.purchaseState.isPremium = true;
    this.purchaseState.hasUnlimitedExports = true;
    this.purchaseState.hasAdvancedTemplates = true;
    await this.savePurchaseState();
  }

  async resetPurchases(): Promise<void> {
    this.purchaseState = {
      isPremium: false,
      hasUnlimitedExports: false,
      hasAdvancedTemplates: false,
      exportsUsed: 0,
      maxExports: 5
    };
    await this.savePurchaseState();
  }
}

export const purchaseService = new PurchaseService();
