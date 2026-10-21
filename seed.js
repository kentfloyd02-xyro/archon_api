import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product from './models/Product.js';
import Project from './models/Project.js';
import Voucher from './models/Voucher.js';
import User from './models/User.js';
import Review from './models/Review.js';
import Order from './models/Order.js';
import AuditLog from './models/AuditLog.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/archon_nell_db';

const INITIAL_PRODUCTS = [
    {
        customId: 'prod-1',
        title: 'High-Strength Self-Leveling Mortar Repair System (25kg)',
        category: 'mortar',
        price: 2450,
        originalPrice: 3200,
        shippingWeightKg: 25,
        stock: 50,
        sold: 1420,
        rating: 4.9,
        discount: '23% OFF',
        image: '/assets/images/leveling_mortar_1785519746126.png',
        badge: 'STORE PREFERRED',
        specs: ['Highway & Bridge Certified', 'Fast 24h Cure', 'Ultra High Durability'],
        description: 'High-performance cementitious self-leveling mortar engineered for rapid industrial floor rehabilitation and heavy vehicular traffic.'
    },
    {
        customId: 'prod-2',
        title: 'Epoxy Crack Injection Resin System (Complete Kit)',
        category: 'epoxy',
        price: 3800,
        originalPrice: 4500,
        shippingWeightKg: 20,
        stock: 35,
        sold: 890,
        rating: 5.0,
        discount: '15% OFF',
        image: '/assets/images/epoxy_crack_injection_1785519729415.png',
        badge: 'TOP SELLER',
        specs: ['Structural Repair', 'Low Viscosity', 'Bridge & Highway Approved'],
        description: 'Ultra-low viscosity structural epoxy injection polymer formulated to seal deep hairline to structural cracks in bridge decks and building columns.'
    },
    {
        customId: 'prod-3',
        title: 'MegaFlow SP402 Concrete Superplasticizer Admixture (20L)',
        category: 'admixture',
        price: 4950,
        originalPrice: 6000,
        shippingWeightKg: 20,
        stock: 25,
        sold: 650,
        rating: 4.9,
        discount: '17% OFF',
        image: '/assets/images/concrete_admixture_1785519590894.png',
        badge: 'CONMIX LICENSE',
        specs: ['High Slump Retention', 'Metro Manila Infrastructure Approved', '20L Drum'],
        description: 'Third-generation high-range water reducer producing flowing concrete with superior compressive strength and long workability windows.'
    },
    {
        customId: 'prod-4',
        title: 'Polymer Waterproofing Membrane Coating Sealant (10L)',
        category: 'waterproof',
        price: 1850,
        originalPrice: 2300,
        shippingWeightKg: 10,
        stock: 40,
        sold: 2100,
        rating: 4.8,
        discount: '20% OFF',
        image: '/assets/images/waterproofing_system_1785519712135.png',
        badge: 'PROMO DEAL',
        specs: ['Swimming Pool Approved', 'Elastic Seal', '10L Bucket'],
        description: 'Flexible two-component polymer-modified elastomeric waterproof barrier against hydrostatic water pressure and chemical degradation.'
    },
    {
        customId: 'prod-5',
        title: 'MF3000 Concrete Pavement Road Additive (25kg Bag)',
        category: 'mortar',
        price: 3100,
        originalPrice: 3800,
        shippingWeightKg: 25,
        stock: 30,
        sold: 430,
        rating: 4.9,
        discount: '18% OFF',
        image: '/assets/images/mf3000_concrete_pavement_road_additive.png',
        badge: 'HIGH STRENGTH',
        specs: ['San Simon Project Spec', 'Heavy Axle Load', '25kg Bag'],
        description: 'Polymer fiber reinforcement compound delivering exceptional flexural strength under severe tollway wheel friction.'
    },
    {
        customId: 'prod-6',
        title: 'Rapid 24-Hour Concrete Accelerator Compound (15L)',
        category: 'admixture',
        price: 5200,
        originalPrice: 6500,
        shippingWeightKg: 15,
        stock: 20,
        sold: 510,
        rating: 5.0,
        discount: '20% OFF',
        image: '/assets/images/rapid_24h_concrete_accelerator_compound.png',
        badge: 'HIGHWAY SPEC',
        specs: ['Candaba Pampanga Pilot Run', '1-Day Heavy Traffic Load'],
        description: 'Chloride-free rapid setting hardening agent accelerating early compressive strength gain for critical rush road projects.'
    }
];

const INITIAL_PROJECTS = [
    {
        customId: 'proj-1',
        title: 'High-Strength Self Leveling Mortar Road Repair',
        location: 'C-5 Highway Corridor, Pasig (Metro Manila)',
        date: 'Jan 31 – Feb 2, 2020',
        contractor: 'Applied by RF Flores Construction',
        region: 'Metro Manila',
        summary: 'Pavement rehabilitation of national road sections using Archon Nell high-strength self-leveling repair system.',
        image: '/assets/images/High-Strength Self Leveling Mortar Road Repair.jpg'
    },
    {
        customId: 'proj-2',
        title: 'National Pavement Pilot Run for "One-Day Concrete"',
        location: 'EDSA Balintawak Section, Quezon City (Metro Manila)',
        date: 'January 10, 2020',
        contractor: 'Poured by Eddmari Construction & Trading Corp.',
        region: 'Metro Manila',
        summary: 'Official demonstration of rapid strength concrete technology allowing traffic opening in 24 hours.',
        image: '/assets/images/National Pavement Pilot Run for One-Day Concrete.jpg'
    },
    {
        customId: 'proj-3',
        title: 'San Simon Pavement Road Repair Project',
        location: 'Roxas Boulevard & Port Access, Manila (Metro Manila)',
        date: 'November 14, 2019',
        contractor: 'Archon Nell Engineering Team',
        region: 'Metro Manila',
        summary: 'Concrete pavement repair utilizing Megaflow, SP402 & MF3000 high-durability admixtures.',
        image: '/assets/images/San Simon Pavement Road Repair Project.jpg'
    },
    {
        customId: 'proj-4',
        title: 'Major Waterworks & Dam Infrastructure Supply',
        location: 'La Mesa Reservoir Corridor, Quezon City (Metro Manila)',
        date: '2019 – 2023 (4-Year Project)',
        contractor: 'National Waterways Authority',
        region: 'Metro Manila',
        summary: 'Continuous 4-year bulk supply of specialized high-slump concrete admixtures for major infrastructure.',
        image: '/assets/images/Major Metro Manila Infrastructure Admixture Supply.jpg'
    }
];

const INITIAL_VOUCHERS = [
    { code: 'ARCHON20', discountType: 'PERCENTAGE', discountValue: 20, minSpend: 1000, isActive: true },
    { code: 'ARCHON500', discountType: 'FIXED_AMOUNT', discountValue: 500, minSpend: 5000, isActive: true },
    { code: 'FREESHIP', discountType: 'FREE_SHIPPING', discountValue: 150, minSpend: 0, isActive: true }
];

const INITIAL_USERS = [
    {
        name: 'Archon Nell Administrator',
        email: 'jimmyontiveros01@gmail.com',
        password: 'Admin@123',
        phone: '09171234567',
        company: 'Archon Nell Engineering Operations',
        role: 'admin',
        defaultAddress: 'Felix Ave. Cainta, Rizal / Metro Manila Site',
        privacyConsent: { granted: true, consentedAt: '2026-09-01T08:00:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Kent Tagle',
        email: 'michaelbascon04@gmail.com',
        password: 'Customer@123',
        phone: '09289876543',
        company: 'Mega Infrastructure & Builders Corp.',
        role: 'customer',
        defaultAddress: 'Lot 14 Blk 3 Mega Highway Depot, C-5 Corridor, Pasig City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-09-15T09:30:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Carlos Mendoza',
        email: 'carlos.mendoza@dmci.com.ph',
        password: 'Customer@123',
        phone: '09185551201',
        company: 'DMCI Project Operations',
        role: 'customer',
        defaultAddress: 'DMCI Compound, Pasong Tamo Ext., Makati City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-09-18T11:00:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Arch. Maricel Reyes',
        email: 'maricel.reyes@megawide.com.ph',
        password: 'Customer@123',
        phone: '09224443312',
        company: 'Megawide Construction Corp.',
        role: 'customer',
        defaultAddress: '20 N. Domingo St., Quezon City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-09-20T14:15:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Eduardo Santos',
        email: 'eduardo.santos@eei.com.ph',
        password: 'Customer@123',
        phone: '09178889923',
        company: 'EEI Heavy Engineering Corporation',
        role: 'customer',
        defaultAddress: 'EEI Main Office, Ortigas Ave., Pasig City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-09-22T10:00:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Ramon Bautista',
        email: 'ramon.bautista@makati-dev.ph',
        password: 'Customer@123',
        phone: '09193338871',
        company: 'Makati Development Corporation',
        role: 'customer',
        defaultAddress: 'Ayala Triangle Tower, Ayala Ave., Makati City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-09-25T16:20:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Teresa Garcia',
        email: 'teresa.garcia@sta-clara.ph',
        password: 'Customer@123',
        phone: '09276662244',
        company: 'Sta. Clara International Builders',
        role: 'customer',
        defaultAddress: 'Highway Depot, West Service Rd., Muntinlupa City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-09-28T09:45:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Antonio Aquino',
        email: 'antonio.aquino@firstbalfour.com',
        password: 'Customer@123',
        phone: '09151239876',
        company: 'First Balfour Inc. Infrastructure',
        role: 'customer',
        defaultAddress: 'KM 19 West Service Rd., Sucat, Paranaque City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-01T13:30:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Patricia Lim',
        email: 'patricia.lim@alvey-builders.ph',
        password: 'Customer@123',
        phone: '09207775511',
        company: 'Alvey Builders & Civil Works',
        role: 'customer',
        defaultAddress: 'Bonifacio Global City, Taguig City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-03T11:10:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Francis Villanueva',
        email: 'francis.villanueva@sanmiguel.ph',
        password: 'Customer@123',
        phone: '09172228833',
        company: 'San Miguel Infrastructure Operations',
        role: 'customer',
        defaultAddress: 'SMC Head Office Complex, Ortigas Center, Mandaluyong City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-05T15:00:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Rowena Dela Cruz',
        email: 'rowena.delacruz@monark.ph',
        password: 'Customer@123',
        phone: '09284449900',
        company: 'Monark Highway Equipment & Works',
        role: 'customer',
        defaultAddress: 'Monark Heavy Yard, E. Rodriguez Jr. Ave., Quezon City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-08T08:30:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Joseph Tan',
        email: 'joseph.tan@metro-pacific.ph',
        password: 'Customer@123',
        phone: '09181116677',
        company: 'Metro Pacific Tollways Corp.',
        role: 'customer',
        defaultAddress: 'NLEX Balintawak Operations Center, Caloocan City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-10T12:00:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Arch. Maria Castro',
        email: 'maria.castro@cebu-infra.ph',
        password: 'Customer@123',
        phone: '09223331188',
        company: 'Metro Infrastructure Consortium',
        role: 'customer',
        defaultAddress: 'Roxas Boulevard Coastal Bay, Manila, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-12T14:40:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Albert Soriano',
        email: 'albert.soriano@davao-builders.ph',
        password: 'Customer@123',
        phone: '09195554422',
        company: 'Prime Engineering Group',
        role: 'customer',
        defaultAddress: 'Shaw Boulevard Industrial Center, Mandaluyong City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-14T17:15:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Grace Navarro',
        email: 'grace.navarro@bataan-co.ph',
        password: 'Customer@123',
        phone: '09278883344',
        company: 'Metro Heavy Industrial Corp.',
        role: 'customer',
        defaultAddress: 'Manila North Harbor Logistics Yard, Tondo, Manila, Metro Manila',
        privacyConsent: { granted: false, consentedAt: '2026-10-18T10:00:00Z', policyVersion: 'RA10173-2026.1' }
    },
    {
        name: 'Engr. Richard Mercado',
        email: 'richard.mercado@cavite-express.ph',
        password: 'Customer@123',
        phone: '09156667788',
        company: 'Expressway Consortium',
        role: 'customer',
        defaultAddress: 'Macapagal Blvd., Aseana City, Paranaque City, Metro Manila',
        privacyConsent: { granted: true, consentedAt: '2026-10-19T09:10:00Z', policyVersion: 'RA10173-2026.1' }
    }
];

// 24 REVIEWS (At least 4 verified reviews for every single product: prod-1 to prod-6)
const INITIAL_REVIEWS = [
    // prod-1 (4 reviews)
    {
        productCustomId: 'prod-1',
        userName: 'Engr. Kent Tagle',
        rating: 5,
        comment: 'Super fast curing! Reopened the tollway in under 24 hours.',
        verified: true,
        date: '2026-10-14'
    },
    {
        productCustomId: 'prod-1',
        userName: 'Engr. Carlos Mendoza',
        rating: 5,
        comment: 'Testing lab approved core drill results with 5500 psi.',
        verified: true,
        date: '2026-10-10'
    },
    {
        productCustomId: 'prod-1',
        userName: 'Arch. Maricel Reyes',
        rating: 5,
        comment: 'Leveling mortar flowed smoothly into 15mm floor dips.',
        verified: true,
        date: '2026-09-28'
    },
    {
        productCustomId: 'prod-1',
        userName: 'Engr. Eduardo Santos',
        rating: 5,
        comment: 'High early compressive strength, zero micro-cracks on slab.',
        verified: true,
        date: '2026-09-18'
    },

    // prod-2 (4 reviews)
    {
        productCustomId: 'prod-2',
        userName: 'Engr. Eduardo Santos',
        rating: 5,
        comment: 'Deep penetration even on 0.2mm hairline fissure cracks.',
        verified: true,
        date: '2026-10-12'
    },
    {
        productCustomId: 'prod-2',
        userName: 'Ramon Bautista',
        rating: 5,
        comment: 'Sealed all structural basement cracks without leakage.',
        verified: true,
        date: '2026-10-04'
    },
    {
        productCustomId: 'prod-2',
        userName: 'Engr. Teresa Garcia',
        rating: 4,
        comment: 'Complete kit with nozzles made bridge pier repair simple.',
        verified: true,
        date: '2026-09-22'
    },
    {
        productCustomId: 'prod-2',
        userName: 'Engr. Antonio Aquino',
        rating: 5,
        comment: 'Low viscosity resin fully bonded the cracked retaining wall.',
        verified: true,
        date: '2026-09-14'
    },

    // prod-3 (4 reviews)
    {
        productCustomId: 'prod-3',
        userName: 'Engr. Antonio Aquino',
        rating: 5,
        comment: 'Maintains 200mm slump for over 90 mins in Metro Manila.',
        verified: true,
        date: '2026-10-15'
    },
    {
        productCustomId: 'prod-3',
        userName: 'Patricia Lim',
        rating: 5,
        comment: 'Reduced water demand by 25% while increasing cube strength.',
        verified: true,
        date: '2026-10-06'
    },
    {
        productCustomId: 'prod-3',
        userName: 'Engr. Francis Villanueva',
        rating: 5,
        comment: 'Excellent pumpability for 40-storey continuous concrete pour.',
        verified: true,
        date: '2026-09-25'
    },
    {
        productCustomId: 'prod-3',
        userName: 'Rowena Dela Cruz',
        rating: 5,
        comment: 'Superb slump retention under extreme midday heat in Pasig.',
        verified: true,
        date: '2026-09-12'
    },

    // prod-4 (4 reviews)
    {
        productCustomId: 'prod-4',
        userName: 'Rowena Dela Cruz',
        rating: 5,
        comment: 'Zero seepage in water retaining tank after 72-hour test.',
        verified: true,
        date: '2026-10-11'
    },
    {
        productCustomId: 'prod-4',
        userName: 'Engr. Joseph Tan',
        rating: 4,
        comment: 'Flexible polymer membrane bridged hairline substrate cracks.',
        verified: true,
        date: '2026-10-01'
    },
    {
        productCustomId: 'prod-4',
        userName: 'Arch. Maria Castro',
        rating: 5,
        comment: 'Elastic waterproof barrier held perfectly against rainwater.',
        verified: true,
        date: '2026-09-18'
    },
    {
        productCustomId: 'prod-4',
        userName: 'Engr. Albert Soriano',
        rating: 5,
        comment: 'Two-coat application fully waterproofed our roof deck.',
        verified: true,
        date: '2026-09-08'
    },

    // prod-5 (4 reviews)
    {
        productCustomId: 'prod-5',
        userName: 'Engr. Albert Soriano',
        rating: 5,
        comment: 'Heavy axle friction showed zero raveling after 6 months.',
        verified: true,
        date: '2026-10-13'
    },
    {
        productCustomId: 'prod-5',
        userName: 'Grace Navarro',
        rating: 5,
        comment: 'Polymer fibers blended evenly in transit mixer without balling.',
        verified: true,
        date: '2026-10-05'
    },
    {
        productCustomId: 'prod-5',
        userName: 'Engr. Kent Tagle',
        rating: 5,
        comment: 'Exceeded flexural design target for San Simon bypass road.',
        verified: true,
        date: '2026-09-20'
    },
    {
        productCustomId: 'prod-5',
        userName: 'Engr. Richard Mercado',
        rating: 5,
        comment: 'Drastically reduced pavement rutting under heavy truck lanes.',
        verified: true,
        date: '2026-09-10'
    },

    // prod-6 (4 reviews)
    {
        productCustomId: 'prod-6',
        userName: 'Engr. Richard Mercado',
        rating: 5,
        comment: 'Candaba Pampanga pilot run hit 3200 psi within 24 hours.',
        verified: true,
        date: '2026-10-16'
    },
    {
        productCustomId: 'prod-6',
        userName: 'Engr. Carlos Mendoza',
        rating: 5,
        comment: 'Allowed asphalt overlay paving the very next morning on EDSA.',
        verified: true,
        date: '2026-10-08'
    },
    {
        productCustomId: 'prod-6',
        userName: 'Engr. Eduardo Santos',
        rating: 5,
        comment: 'Rush highway intersection opened on schedule with high strength.',
        verified: true,
        date: '2026-09-15'
    },
    {
        productCustomId: 'prod-6',
        userName: 'Arch. Maricel Reyes',
        rating: 5,
        comment: 'Accelerated initial set time from 6 hours down to 90 minutes.',
        verified: true,
        date: '2026-09-02'
    }
];

// Helper to build 40 orders matching customers and strictly fulfilling the 50% review rule
const CUSTOMERS_LIST = INITIAL_USERS.filter(u => u.role === 'customer');

const REVIEW_NOTES_LIST = [
    'Superb curing speed and zero hairline cracks on our slab.',     // 57 chars
    'High early strength, road opened in 24 hours on time.',         // 53 chars
    'Good slump flow and easy pumping through the hose line.',       // 55 chars
    'Sealed all deep pier cracks completely with zero leaks.',       // 55 chars
    'Excellent bond strength on wet concrete bridge footing.',       // 55 chars
    'Rapid compressive strength reached 3500 psi overnight.',       // 54 chars
    'Maintained 180mm slump retention under heavy summer heat.',     // 57 chars
    'Fast initial set; works perfectly for rush repair lanes.',     // 56 chars
    'Solid flexural strength, withstands high axle friction.',       // 55 chars
    'Elastic coating sealed our roof deck water leaks fast.',        // 54 chars
    'Leveling mortar flowed evenly with smooth trowel finish.',       // 56 chars
    'High-grade epoxy penetration stabilized the pier column.',       // 56 chars
    'Significant water reduction while keeping top strength.',        // 55 chars
    'Zero water ingress after heavy monsoon rain at our site.',       // 56 chars
    'Reinforced road section shows zero rutting under trucks.',       // 56 chars
    'Poured foundation achieved target design strength early.',       // 56 chars
    'High workability and zero segregation during slab pour.',        // 55 chars
    'Nozzle injection sealed all basement wall leaks tightly.',       // 56 chars
    'Superplasticizer kept slump consistent across 15 trucks.',       // 56 chars
    'Accelerated curing allowed overnight pavement overlay.'          // 55 chars
];

const ORDER_TEMPLATES = [
    [{ customId: 'prod-1', qty: 4 }],
    [{ customId: 'prod-3', qty: 6 }],
    [{ customId: 'prod-2', qty: 3 }],
    [{ customId: 'prod-4', qty: 8 }],
    [{ customId: 'prod-5', qty: 10 }],
    [{ customId: 'prod-6', qty: 5 }],
    [{ customId: 'prod-1', qty: 2 }, { customId: 'prod-3', qty: 3 }],
    [{ customId: 'prod-5', qty: 4 }, { customId: 'prod-6', qty: 2 }],
    [{ customId: 'prod-2', qty: 2 }, { customId: 'prod-4', qty: 4 }],
    [{ customId: 'prod-3', qty: 4 }, { customId: 'prod-5', qty: 6 }]
];

const ORDER_STATUS_DISTRIBUTION = [
    ...Array(20).fill('DELIVERED'),
    ...Array(5).fill('IN_TRANSIT'),
    ...Array(4).fill('PREPARING'),
    ...Array(4).fill('CONFIRMED'),
    ...Array(3).fill('CANCELLED'),
    ...Array(2).fill('REFUND_REQUESTED'),
    ...Array(2).fill('REFUNDED')
];

const PAYMENT_METHODS = ['GCash', 'Maya', 'Bank', 'COD'];

const INITIAL_ORDERS = ORDER_STATUS_DISTRIBUTION.map((status, index) => {
    const orderNumSuffix = 88412 + index;
    const orderNumber = `AN-ORD-2026-${orderNumSuffix}`;
    const customer = CUSTOMERS_LIST[index % CUSTOMERS_LIST.length];
    const template = ORDER_TEMPLATES[index % ORDER_TEMPLATES.length];

    const items = template.map(t => {
        const prod = INITIAL_PRODUCTS.find(p => p.customId === t.customId);
        return {
            customId: prod.customId,
            title: prod.title,
            price: prod.price,
            quantity: t.qty,
            total: prod.price * t.qty
        };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const shippingFee = (index % 3 === 0) ? 0 : 300;
    const discountAmount = (index % 4 === 0) ? 500 : 0;
    const discountType = discountAmount > 0 ? 'ARCHON500' : (shippingFee === 0 ? 'FREESHIP' : '');
    const totalAmount = subtotal + shippingFee - discountAmount;
    const paymentMethod = PAYMENT_METHODS[index % PAYMENT_METHODS.length];

    const day = (index % 25) + 1;
    const dayStr = String(day).padStart(2, '0');
    const month = index < 25 ? '10' : '09';
    const monthName = month === '10' ? 'Oct' : 'Sep';
    const createdAt = new Date(`2026-${month}-${dayStr}T10:00:00Z`);

    const isDelivered = status === 'DELIVERED';
    const isInTransit = status === 'IN_TRANSIT';
    const isPreparing = status === 'PREPARING';
    const isConfirmed = status === 'CONFIRMED';
    const isCancelled = status === 'CANCELLED';

    const timeline = [
        { step: 'Order Placed', time: `${monthName} ${day}, 2026 - 10:00 AM`, done: true, isCancelled: false },
        { step: 'Payment Review', time: 'Payment Verified', done: true, isCancelled: false },
        { step: 'Factory Packed', time: `${monthName} ${day}, 2026 - 02:30 PM`, done: !isConfirmed, isCancelled: false },
        { step: 'Out for Delivery', time: `${monthName} ${day + 1}, 2026 - 08:30 AM`, done: isDelivered || isInTransit, isCancelled: false },
        { step: 'Delivered', time: isDelivered ? `${monthName} ${day + 1}, 2026 - 04:15 PM` : 'Pending confirmation', done: isDelivered, isCancelled: false }
    ];

    if (isCancelled) {
        timeline.push({ step: 'Cancelled: Customer request - Wrong size', time: `${monthName} ${day}, 2026 - 11:30 AM`, done: true, isCancelled: true });
    }

    const orderObj = {
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        deliveryAddress: customer.defaultAddress,
        deliveryNotes: `Gate ${index + 1} Industrial Staging Area`,
        paymentMethod,
        gcashRefNumber: paymentMethod === 'GCash' ? `GC-${987654321000 + index}` : (paymentMethod === 'Maya' ? `MYA-${554433221100 + index}` : (paymentMethod === 'Bank' ? `BDO-TRX-${112233 + index}` : '')),
        proofImage: null,
        items,
        subtotal,
        shippingFee,
        discountAmount,
        discountType,
        totalAmount,
        status,
        createdAt,
        trackingTimeline: timeline
    };

    if (isCancelled) {
        orderObj.cancelReason = 'Customer request - Change of project plans';
        orderObj.cancelledAt = new Date(`2026-${month}-${dayStr}T12:00:00Z`);
    }

    if (status === 'REFUND_REQUESTED') {
        orderObj.refundDetails = {
            reason: 'DAMAGED_ITEM',
            details: 'One bucket punctured during forklift unloading at site.',
            damagePhoto: '/assets/images/waterproofing_system_1785519712135.png',
            refundStatus: 'PENDING_REVIEW',
            requestedAt: new Date(`2026-${month}-${dayStr}T14:00:00Z`)
        };
    }

    if (status === 'REFUNDED') {
        orderObj.refundDetails = {
            reason: 'WRONG_ITEM',
            details: 'Incorrect admixture formulation shipped; refund approved by QA.',
            damagePhoto: null,
            refundStatus: 'APPROVED',
            requestedAt: new Date(`2026-${month}-${dayStr}T14:00:00Z`),
            approvedAt: new Date(`2026-${month}-${dayStr}T16:30:00Z`)
        };
    }

    // Exactly 50% of DELIVERED orders have review:
    // Out of 20 DELIVERED (indices 0 through 19), indices 0 through 9 have reviews!
    if (isDelivered && index < 10) {
        orderObj.rating = (index % 3 === 0) ? 4 : 5;
        orderObj.notes = REVIEW_NOTES_LIST[index];
        const nextDay = String(Math.min(28, Number(day) + 1)).padStart(2, "0");
        orderObj.ratedAt = new Date(`2026-${month}-${nextDay}T17:00:00Z`);
    }

    return orderObj;
});

const INITIAL_AUDIT_LOGS = [
    {
        action: 'SYSTEM_SEED_INITIALIZED',
        performedBy: {
            email: 'system@archonnell.com',
            name: 'Archon Nell System',
            role: 'system'
        },
        target: 'MongoDB archon_nell_db',
        details: 'Initial database seeding executed with 6 products, 40 orders, and 16 user accounts.',
        ip: '127.0.0.1',
        userAgent: 'Archon Nell Seeder v2.0',
        createdAt: new Date('2026-10-21T07:00:00Z')
    },
    {
        action: 'LOGIN_2FA_SUCCESS',
        performedBy: {
            email: 'jimmyontiveros01@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'jimmyontiveros01@gmail.com',
        details: 'Successful 2FA OTP verification for role: ADMIN',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0',
        createdAt: new Date('2026-10-21T07:15:00Z')
    },
    {
        action: 'DELIVERY_STATUS_UPDATED',
        performedBy: {
            email: 'jimmyontiveros01@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'AN-ORD-2026-88412',
        details: 'Delivery status confirmed as DELIVERED to Metro Manila site',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T07:30:00Z')
    }
];

// Function to automatically sync archon/src/data/initialData.js
function syncFrontendInitialData(products, projects, reviews, orders) {
    try {
        const frontendPath = path.resolve('..', 'archon', 'src', 'data', 'initialData.js');
        if (!fs.existsSync(path.dirname(frontendPath))) return;

        // Group reviews by productCustomId
        const reviewsByProduct = {};
        products.forEach(p => {
            reviewsByProduct[p.customId] = [];
        });
        reviews.forEach((r, idx) => {
            const key = r.productCustomId;
            if (!reviewsByProduct[key]) reviewsByProduct[key] = [];
            reviewsByProduct[key].push({
                id: `rev-${idx + 1}`,
                userName: r.userName,
                rating: r.rating,
                date: r.date || '2026-10-15',
                comment: r.comment,
                verified: Boolean(r.verified)
            });
        });

        // Format orders for initialData
        const formattedOrders = orders.map(o => ({
            orderNumber: o.orderNumber,
            date: o.createdAt.toISOString(),
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            customerPhone: o.customerPhone,
            deliveryAddress: o.deliveryAddress,
            deliveryNotes: o.deliveryNotes || '',
            paymentMethod: o.paymentMethod,
            gcashRefNumber: o.gcashRefNumber || '',
            proofImage: o.proofImage || null,
            items: o.items.map(it => ({
                id: it.customId,
                customId: it.customId,
                title: it.title,
                price: it.price,
                quantity: it.quantity,
                total: it.total
            })),
            subtotal: o.subtotal,
            shippingFee: o.shippingFee,
            discountAmount: o.discountAmount,
            discountType: o.discountType,
            totalAmount: o.totalAmount,
            status: o.status,
            cancelReason: o.cancelReason || null,
            cancelledAt: o.cancelledAt ? o.cancelledAt.toISOString() : null,
            trackingTimeline: o.trackingTimeline,
            refundDetails: o.refundDetails || null,
            rating: o.rating || null,
            notes: o.notes || null,
            ratedAt: o.ratedAt ? o.ratedAt.toISOString() : null
        }));

        const frontendContent = `// Auto-generated & synced by archon_api/seed.js
export const INITIAL_PRODUCTS = ${JSON.stringify(products.map(p => ({
    id: p.customId,
    customId: p.customId,
    title: p.title,
    category: p.category,
    price: p.price,
    shippingWeightKg: p.shippingWeightKg || 20,
    originalPrice: p.originalPrice,
    stock: p.stock,
    sold: p.sold,
    rating: p.rating,
    discount: p.discount,
    image: p.image,
    badge: p.badge,
    specs: p.specs,
    description: p.description
})), null, 2)};

export const INITIAL_PROJECTS = ${JSON.stringify(projects.map(p => ({
    id: p.customId,
    title: p.title,
    location: p.location,
    date: p.date,
    contractor: p.contractor,
    region: p.region,
    summary: p.summary,
    image: p.image
})), null, 2)};

export const INITIAL_REVIEWS = ${JSON.stringify(reviewsByProduct, null, 2)};

export const INITIAL_ORDERS = ${JSON.stringify(formattedOrders, null, 2)};
`;

        fs.writeFileSync(frontendPath, frontendContent, 'utf8');
        console.log(`Successfully synced ${formattedOrders.length} orders and reviews to archon/src/data/initialData.js!`);
    } catch (e) {
        console.warn('Frontend initialData sync warning:', e.message);
    }
}

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('Connected! Clearing and inserting seed data...');

        // Clear existing collections
        await Product.deleteMany({});
        await Project.deleteMany({});
        await Voucher.deleteMany({});
        await User.deleteMany({});
        await Review.deleteMany({});
        await Order.deleteMany({});
        await AuditLog.deleteMany({});

        // 1. Insert Products
        const createdProducts = await Product.insertMany(INITIAL_PRODUCTS);
        const productMap = {};
        createdProducts.forEach(p => {
            productMap[p.customId] = p._id;
        });
        console.log(`Seeded ${createdProducts.length} products`);

        // 2. Insert Projects
        await Project.insertMany(INITIAL_PROJECTS);
        console.log(`Seeded ${INITIAL_PROJECTS.length} projects`);

        // 3. Insert Vouchers
        await Voucher.insertMany(INITIAL_VOUCHERS);
        console.log(`Seeded ${INITIAL_VOUCHERS.length} vouchers`);

        // 4. Insert Users (using User.create so bcrypt password hashing runs)
        const userMap = {};
        for (const u of INITIAL_USERS) {
            const createdUser = await User.create(u);
            userMap[createdUser.email.toLowerCase().trim()] = createdUser._id;
        }
        console.log(`Seeded ${INITIAL_USERS.length} registered users (admin + 15 customers)`);

        // 5. Link Orders to User IDs and Product IDs
        const ordersToInsert = INITIAL_ORDERS.map(order => {
            const userId = userMap[order.customerEmail.toLowerCase().trim()];
            const itemsWithIds = order.items.map(item => ({
                ...item,
                productId: productMap[item.customId]
            }));

            return {
                ...order,
                user: userId,
                items: itemsWithIds
            };
        });

        const createdOrders = await Order.insertMany(ordersToInsert);
        console.log(`Seeded ${createdOrders.length} orders across all 15 customers`);

        // 6. Link Reviews to Product IDs and insert
        const reviewsToInsert = INITIAL_REVIEWS.map(r => ({
            ...r,
            productId: productMap[r.productCustomId]
        }));
        await Review.insertMany(reviewsToInsert);
        console.log(`Seeded ${reviewsToInsert.length} reviews (all 6 products covered)`);

        // 7. Insert Audit Logs
        await AuditLog.insertMany(INITIAL_AUDIT_LOGS);
        console.log(`Seeded ${INITIAL_AUDIT_LOGS.length} audit logs`);

        // 8. Sync frontend data file
        syncFrontendInitialData(INITIAL_PRODUCTS, INITIAL_PROJECTS, INITIAL_REVIEWS, INITIAL_ORDERS);

        // Verification summary
        const deliveredCount = INITIAL_ORDERS.filter(o => o.status === 'DELIVERED').length;
        const reviewedDeliveredCount = INITIAL_ORDERS.filter(o => o.status === 'DELIVERED' && o.rating && o.notes).length;
        console.log(`\n--- SEED VERIFICATION ---`);
        console.log(`Total Orders: ${INITIAL_ORDERS.length}`);
        console.log(`Delivered Orders: ${deliveredCount}`);
        console.log(`Reviews count: ${INITIAL_REVIEWS.length} across ${new Set(INITIAL_REVIEWS.map(r => r.productCustomId)).size} products`);
        console.log('--- SEED COMPLETED SUCCESSFULLY! ---');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seedDatabase();
