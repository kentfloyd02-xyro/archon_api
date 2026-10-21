import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';
import Project from './models/Project.js';
import Voucher from './models/Voucher.js';
import User from './models/User.js';
import Review from './models/Review.js';
import Order from './models/Order.js';
import AuditLog from './models/AuditLog.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/archon_nell_db';

const INITIAL_PRODUCTS = [{
        customId: 'prod-1',
        title: 'High-Strength Self-Leveling Mortar Repair System (25kg)',
        category: 'mortar',
        price: 2450,
        originalPrice: 3200,
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
        stock: 25,
        sold: 650,
        rating: 4.9,
        discount: '17% OFF',
        image: '/assets/images/concrete_admixture_1785519590894.png',
        badge: 'CONMIX LICENSE',
        specs: ['High Slump Retention', 'Visayas Dam Approved', '20L Drum'],
        description: 'Third-generation high-range water reducer producing flowing concrete with superior compressive strength and long workability windows.'
    },
    {
        customId: 'prod-4',
        title: 'Polymer Waterproofing Membrane Coating Sealant (10L)',
        category: 'waterproof',
        price: 1850,
        originalPrice: 2300,
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
        stock: 30,
        sold: 430,
        rating: 4.9,
        discount: '18% OFF',
        image: '/assets/images/MF3000 Concrete Pavement Road Additive (25kg Bag).png',
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
        stock: 20,
        sold: 510,
        rating: 5.0,
        discount: '20% OFF',
        image: '/assets/images/Rapid 24-Hour Concrete Accelerator Compound (15L).png',
        badge: 'HIGHWAY SPEC',
        specs: ['Candaba Pampanga Pilot Run', '1-Day Heavy Traffic Load'],
        description: 'Chloride-free rapid setting hardening agent accelerating early compressive strength gain for critical rush road projects.'
    }
];

const INITIAL_PROJECTS = [{
        customId: 'proj-1',
        title: 'High-Strength Self Leveling Mortar Road Repair',
        location: 'Sta. Maria, Pangasinan (Luzon)',
        date: 'Jan 31 – Feb 2, 2020',
        contractor: 'Applied by RF Flores Construction',
        region: 'Luzon',
        summary: 'Pavement rehabilitation of national road sections using Archon Nell high-strength self-leveling repair system.',
        image: '/assets/images/leveling_mortar_1785519746126.png'
    },
    {
        customId: 'proj-2',
        title: 'National Pavement Pilot Run for "One-Day Concrete"',
        location: 'Candaba, Pampanga (Luzon)',
        date: 'January 10, 2020',
        contractor: 'Poured by Eddmari Construction & Trading Corp.',
        region: 'Luzon',
        summary: 'Official demonstration of rapid strength concrete technology allowing traffic opening in 24 hours.',
        image: '/assets/images/concrete_admixture_1785519590894.png'
    },
    {
        customId: 'proj-3',
        title: 'San Simon Pavement Road Repair Project',
        location: 'San Simon, Pampanga (Luzon)',
        date: 'November 14, 2019',
        contractor: 'Archon Nell Engineering Team',
        region: 'Luzon',
        summary: 'Concrete pavement repair utilizing Megaflow, SP402 & MF3000 high-durability admixtures.',
        image: '/assets/images/waterproofing_system_1785519712135.png'
    },
    {
        customId: 'proj-4',
        title: 'Major Visayas Dam Construction Admixture Supply',
        location: 'Visayas Region',
        date: '2019 – 2023 (4-Year Project)',
        contractor: 'National Waterways Authority',
        region: 'Visayas',
        summary: 'Continuous 4-year bulk supply of specialized high-slump concrete admixtures for major hydro dam.',
        image: '/assets/images/concrete_admixture_1785519590894.png'
    }
];

const INITIAL_VOUCHERS = [
    { code: 'ARCHON20', discountType: 'PERCENTAGE', discountValue: 20, minSpend: 0, isActive: true },
    { code: 'ARCHON500', discountType: 'FIXED_AMOUNT', discountValue: 500, minSpend: 5000, isActive: true },
    { code: 'FREESHIP', discountType: 'FREE_SHIPPING', discountValue: 150, minSpend: 0, isActive: true }
];

// REGISTERED USERS (Admin + 15 Customers corresponding to all order placers)
const INITIAL_USERS = [{
        name: 'Archon Nell Administrator',
        email: 'jimmyontiveros01@gmail.com',
        password: 'Admin@123',
        phone: '09171234567',
        company: 'Archon Nell Engineering Operations',
        role: 'admin',
        defaultAddress: 'Felix Ave. Cainta, Rizal / Metro Manila Site'
    },
    {
        name: 'Engr. Kent Tagle',
        email: 'michaelbascon04@gmail.com',
        password: 'Customer@123',
        phone: '09289876543',
        company: 'Mega Infrastructure & Builders Corp.',
        role: 'customer',
        defaultAddress: 'Lot 14 Blk 3 Mega Highway Depot, San Fernando, Pampanga'
    },
    {
        name: 'Engr. Carlos Mendoza',
        email: 'carlos.mendoza@dmci.com.ph',
        password: 'Customer@123',
        phone: '09185551201',
        company: 'DMCI Project Operations',
        role: 'customer',
        defaultAddress: 'DMCI Compound, Pasong Tamo Ext., Makati City'
    },
    {
        name: 'Arch. Maricel Reyes',
        email: 'maricel.reyes@megawide.com.ph',
        password: 'Customer@123',
        phone: '09224443312',
        company: 'Megawide Construction Corp.',
        role: 'customer',
        defaultAddress: '20 N. Domingo St., Quezon City'
    },
    {
        name: 'Engr. Eduardo Santos',
        email: 'eduardo.santos@eei.com.ph',
        password: 'Customer@123',
        phone: '09178889923',
        company: 'EEI Heavy Engineering Corporation',
        role: 'customer',
        defaultAddress: 'EEI Main Office, Ortigas Ave., Pasig City'
    },
    {
        name: 'Ramon Bautista',
        email: 'ramon.bautista@makati-dev.ph',
        password: 'Customer@123',
        phone: '09193338871',
        company: 'Makati Development Corporation',
        role: 'customer',
        defaultAddress: 'Ayala Triangle Tower, Ayala Ave., Makati City'
    },
    {
        name: 'Engr. Teresa Garcia',
        email: 'teresa.garcia@sta-clara.ph',
        password: 'Customer@123',
        phone: '09276662244',
        company: 'Sta. Clara International Builders',
        role: 'customer',
        defaultAddress: 'Highway Depot, San Pedro, Laguna'
    },
    {
        name: 'Engr. Antonio Aquino',
        email: 'antonio.aquino@firstbalfour.com',
        password: 'Customer@123',
        phone: '09151239876',
        company: 'First Balfour Inc. Infrastructure',
        role: 'customer',
        defaultAddress: 'KM 19 West Service Rd., Sucat, Muntinlupa'
    },
    {
        name: 'Patricia Lim',
        email: 'patricia.lim@alvey-builders.ph',
        password: 'Customer@123',
        phone: '09207775511',
        company: 'Alvey Builders & Civil Works',
        role: 'customer',
        defaultAddress: 'Subic Gateway Park, Subic Bay Freeport Zone'
    },
    {
        name: 'Engr. Francis Villanueva',
        email: 'francis.villanueva@sanmiguel.ph',
        password: 'Customer@123',
        phone: '09172228833',
        company: 'San Miguel Infrastructure Operations',
        role: 'customer',
        defaultAddress: 'SMC Head Office Complex, Mandaluyong City'
    },
    {
        name: 'Rowena Dela Cruz',
        email: 'rowena.delacruz@monark.ph',
        password: 'Customer@123',
        phone: '09284449900',
        company: 'Monark Highway Equipment & Works',
        role: 'customer',
        defaultAddress: 'Monark Yard, San Fernando, Pampanga'
    },
    {
        name: 'Engr. Joseph Tan',
        email: 'joseph.tan@metro-pacific.ph',
        password: 'Customer@123',
        phone: '09181116677',
        company: 'Metro Pacific Tollways Corp.',
        role: 'customer',
        defaultAddress: 'NLEX Compound, Balintawak, Caloocan City'
    },
    {
        name: 'Arch. Maria Castro',
        email: 'maria.castro@cebu-infra.ph',
        password: 'Customer@123',
        phone: '09223331188',
        company: 'Cebu Link Constructors',
        role: 'customer',
        defaultAddress: 'SRP Coastal Road, Cebu City'
    },
    {
        name: 'Engr. Albert Soriano',
        email: 'albert.soriano@davao-builders.ph',
        password: 'Customer@123',
        phone: '09195554422',
        company: 'Davao Prime Engineering Group',
        role: 'customer',
        defaultAddress: 'Buhangin Bypass Rd, Davao City'
    },
    {
        name: 'Grace Navarro',
        email: 'grace.navarro@bataan-co.ph',
        password: 'Customer@123',
        phone: '09278883344',
        company: 'Bataan Heavy Industrial Corp.',
        role: 'customer',
        defaultAddress: 'Roman Superhighway, Limay, Bataan'
    },
    {
        name: 'Engr. Richard Mercado',
        email: 'richard.mercado@cavite-express.ph',
        password: 'Customer@123',
        phone: '09156667788',
        company: 'Cavite Expressway Consortium',
        role: 'customer',
        defaultAddress: 'CAVITEX Plaza, Kawit, Cavite'
    }
];

// 20 ORDERS SPREAD ACROSS ALL 7 DELIVERY STATUSES & MONTHS (Aug, Sep, Oct 2026)
const INITIAL_ORDERS = [{
        orderNumber: 'AN-ORD-2026-88412',
        customerName: 'Engr. Kent Tagle',
        customerEmail: 'michaelbascon04@gmail.com',
        customerPhone: '09289876543',
        deliveryAddress: 'Lot 14 Blk 3 Mega Highway Depot, San Fernando, Pampanga',
        deliveryNotes: 'Gate 2 Industrial Loading Bay',
        paymentMethod: 'GCash',
        gcashRefNumber: '1234567890123',
        proofImage: null,
        items: [{
            customId: 'prod-1',
            title: 'High-Strength Self-Leveling Mortar Repair System (25kg)',
            price: 2450,
            quantity: 4,
            total: 9800
        }],
        subtotal: 9800,
        shippingFee: 150,
        discountAmount: 0,
        discountType: '',
        totalAmount: 9950,
        status: 'IN_TRANSIT',
        createdAt: new Date('2026-10-18T09:30:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 18, 2026 - 09:30 AM', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 18, 2026 - 02:40 PM', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Oct 19, 2026 - 08:00 AM', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Pending confirmation', done: false, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88413',
        customerName: 'Engr. Carlos Mendoza',
        customerEmail: 'carlos.mendoza@dmci.com.ph',
        customerPhone: '09185551201',
        deliveryAddress: 'DMCI Compound, Pasong Tamo Ext., Makati City',
        deliveryNotes: 'Building 4 Heavy Equipment Yard',
        paymentMethod: 'Bank',
        gcashRefNumber: 'BDO-TRX-998812',
        items: [{
            customId: 'prod-3',
            title: 'MegaFlow SP402 Concrete Superplasticizer Admixture (20L)',
            price: 4950,
            quantity: 6,
            total: 29700
        }],
        subtotal: 29700,
        shippingFee: 300,
        discountAmount: 500,
        discountType: 'ARCHON500',
        totalAmount: 29500,
        status: 'DELIVERED',
        createdAt: new Date('2026-10-12T11:15:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 12, 2026 - 11:15 AM', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified Bank Deposit', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 13, 2026 - 09:00 AM', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Oct 13, 2026 - 01:30 PM', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Oct 14, 2026 - 10:45 AM', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88414',
        customerName: 'Arch. Maricel Reyes',
        customerEmail: 'maricel.reyes@megawide.com.ph',
        customerPhone: '09224443312',
        deliveryAddress: '20 N. Domingo St., Quezon City',
        paymentMethod: 'GCash',
        gcashRefNumber: '2881928374619',
        items: [{
            customId: 'prod-4',
            title: 'Polymer Waterproofing Membrane Coating Sealant (10L)',
            price: 1850,
            quantity: 10,
            total: 18500
        }],
        subtotal: 18500,
        shippingFee: 0,
        discountAmount: 150,
        discountType: 'FREESHIP',
        totalAmount: 18500,
        status: 'DELIVERED',
        createdAt: new Date('2026-10-10T14:20:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 10, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 10, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Oct 11, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Oct 11, 2026 - 04:00 PM', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88415',
        customerName: 'Engr. Eduardo Santos',
        customerEmail: 'eduardo.santos@eei.com.ph',
        customerPhone: '09178889923',
        deliveryAddress: 'EEI Main Office, Ortigas Ave., Pasig City',
        paymentMethod: 'Maya',
        gcashRefNumber: 'MY-881923019',
        items: [{
            customId: 'prod-2',
            title: 'Epoxy Crack Injection Resin System (Complete Kit)',
            price: 3800,
            quantity: 5,
            total: 19000
        }],
        subtotal: 19000,
        shippingFee: 250,
        discountAmount: 0,
        totalAmount: 19250,
        status: 'PREPARING',
        createdAt: new Date('2026-10-19T08:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 19, 2026 - 08:00 AM', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Maya Confirmed', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 19, 2026 - 11:30 AM', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: '', done: false, isCancelled: false },
            { step: 'Delivered', time: '', done: false, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88416',
        customerName: 'Ramon Bautista',
        customerEmail: 'ramon.bautista@makati-dev.ph',
        customerPhone: '09193338871',
        deliveryAddress: 'Ayala Triangle Tower, Ayala Ave., Makati City',
        paymentMethod: 'COD',
        items: [{
            customId: 'prod-6',
            title: 'Rapid 24-Hour Concrete Accelerator Compound (15L)',
            price: 5200,
            quantity: 3,
            total: 15600
        }],
        subtotal: 15600,
        shippingFee: 200,
        discountAmount: 0,
        totalAmount: 15800,
        status: 'CONFIRMED',
        createdAt: new Date('2026-10-20T10:10:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 20, 2026 - 10:10 AM', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'COD Verified by Dispatch', done: true, isCancelled: false },
            { step: 'Factory Packed', time: '', done: false, isCancelled: false },
            { step: 'Out for Delivery', time: '', done: false, isCancelled: false },
            { step: 'Delivered', time: '', done: false, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88417',
        customerName: 'Engr. Teresa Garcia',
        customerEmail: 'teresa.garcia@sta-clara.ph',
        customerPhone: '09276662244',
        deliveryAddress: 'Highway Depot, San Pedro, Laguna',
        paymentMethod: 'GCash',
        gcashRefNumber: '881029384756',
        items: [{
            customId: 'prod-5',
            title: 'MF3000 Concrete Pavement Road Additive (25kg Bag)',
            price: 3100,
            quantity: 8,
            total: 24800
        }],
        subtotal: 24800,
        shippingFee: 350,
        discountAmount: 500,
        discountType: 'ARCHON500',
        totalAmount: 24650,
        status: 'IN_TRANSIT',
        createdAt: new Date('2026-10-18T16:45:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 18, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 19, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Oct 20, 2026 - 07:00 AM', done: true, isCancelled: false },
            { step: 'Delivered', time: '', done: false, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88418',
        customerName: 'Engr. Antonio Aquino',
        customerEmail: 'antonio.aquino@firstbalfour.com',
        customerPhone: '09151239876',
        deliveryAddress: 'KM 19 West Service Rd., Sucat, Muntinlupa',
        paymentMethod: 'Bank',
        gcashRefNumber: 'BPI-CORP-44102',
        items: [{
            customId: 'prod-1',
            title: 'High-Strength Self-Leveling Mortar Repair System (25kg)',
            price: 2450,
            quantity: 12,
            total: 29400
        }],
        subtotal: 29400,
        shippingFee: 400,
        discountAmount: 0,
        totalAmount: 29800,
        status: 'DELIVERED',
        createdAt: new Date('2026-10-05T08:30:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 5, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'BPI Wire Cleared', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 5, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Oct 6, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Oct 7, 2026 - 02:15 PM', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88419',
        customerName: 'Patricia Lim',
        customerEmail: 'patricia.lim@alvey-builders.ph',
        customerPhone: '09207775511',
        deliveryAddress: 'Subic Gateway Park, Subic Bay Freeport Zone',
        paymentMethod: 'GCash',
        gcashRefNumber: '992104829103',
        items: [{
            customId: 'prod-2',
            title: 'Epoxy Crack Injection Resin System (Complete Kit)',
            price: 3800,
            quantity: 3,
            total: 11400
        }],
        subtotal: 11400,
        shippingFee: 200,
        discountAmount: 0,
        totalAmount: 11600,
        status: 'REFUND_REQUESTED',
        createdAt: new Date('2026-10-14T13:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 14, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 14, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Oct 15, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Oct 16, 2026', done: true, isCancelled: false }
        ],
        refundDetails: {
            reason: 'Damaged cartridge nozzles during cargo shipment',
            details: '2 out of 3 nozzles cracked in transit. Requesting replacement or partial refund.',
            damagePhoto: '/assets/images/epoxy_crack_injection_1785519729415.png',
            refundStatus: 'PENDING_REVIEW',
            requestedAt: new Date('2026-10-17T10:00:00Z')
        }
    },
    {
        orderNumber: 'AN-ORD-2026-88420',
        customerName: 'Engr. Francis Villanueva',
        customerEmail: 'francis.villanueva@sanmiguel.ph',
        customerPhone: '09172228833',
        deliveryAddress: 'SMC Head Office Complex, Mandaluyong City',
        paymentMethod: 'Bank',
        gcashRefNumber: 'UBP-CORP-99210',
        items: [{
            customId: 'prod-3',
            title: 'MegaFlow SP402 Concrete Superplasticizer Admixture (20L)',
            price: 4950,
            quantity: 15,
            total: 74250
        }],
        subtotal: 74250,
        shippingFee: 500,
        discountAmount: 14850,
        discountType: 'ARCHON20',
        totalAmount: 59900,
        status: 'PREPARING',
        createdAt: new Date('2026-10-19T15:20:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 19, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'UnionBank Wire Confirmed', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Oct 20, 2026 - 08:30 AM', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: '', done: false, isCancelled: false },
            { step: 'Delivered', time: '', done: false, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88421',
        customerName: 'Rowena Dela Cruz',
        customerEmail: 'rowena.delacruz@monark.ph',
        customerPhone: '09284449900',
        deliveryAddress: 'Monark Yard, San Fernando, Pampanga',
        paymentMethod: 'GCash',
        gcashRefNumber: '441920192847',
        items: [{
            customId: 'prod-4',
            title: 'Polymer Waterproofing Membrane Coating Sealant (10L)',
            price: 1850,
            quantity: 6,
            total: 11100
        }],
        subtotal: 11100,
        shippingFee: 150,
        discountAmount: 0,
        totalAmount: 11250,
        status: 'CANCELLED',
        cancelReason: 'Customer ordered wrong pail volume, reordering 20L',
        cancelledAt: new Date('2026-10-16T12:00:00Z'),
        createdAt: new Date('2026-10-16T11:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 16, 2026', done: true, isCancelled: false },
            { step: 'Cancelled: Customer request', time: 'Oct 16, 2026 - 12:00 PM', done: true, isCancelled: true }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88422',
        customerName: 'Engr. Joseph Tan',
        customerEmail: 'joseph.tan@metro-pacific.ph',
        customerPhone: '09181116677',
        deliveryAddress: 'NLEX Compound, Balintawak, Caloocan City',
        paymentMethod: 'Bank',
        gcashRefNumber: 'RCBC-881920',
        items: [{
            customId: 'prod-5',
            title: 'MF3000 Concrete Pavement Road Additive (25kg Bag)',
            price: 3100,
            quantity: 10,
            total: 31000
        }],
        subtotal: 31000,
        shippingFee: 350,
        discountAmount: 500,
        discountType: 'ARCHON500',
        totalAmount: 30850,
        status: 'REFUNDED',
        createdAt: new Date('2026-09-28T09:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Sep 28, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'RCBC Confirmed', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Sep 29, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Sep 29, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Sep 30, 2026', done: true, isCancelled: false }
        ],
        refundDetails: {
            reason: 'Excess bags requested return per QA revision',
            details: 'Approved return of 2 bags, restocked into central plant inventory.',
            damagePhoto: null,
            refundStatus: 'APPROVED',
            requestedAt: new Date('2026-10-01T10:00:00Z'),
            approvedAt: new Date('2026-10-02T14:00:00Z')
        }
    },
    {
        orderNumber: 'AN-ORD-2026-88423',
        customerName: 'Arch. Maria Castro',
        customerEmail: 'maria.castro@cebu-infra.ph',
        customerPhone: '09223331188',
        deliveryAddress: 'SRP Coastal Road, Cebu City',
        paymentMethod: 'GCash',
        gcashRefNumber: '881029481923',
        items: [{
            customId: 'prod-6',
            title: 'Rapid 24-Hour Concrete Accelerator Compound (15L)',
            price: 5200,
            quantity: 5,
            total: 26000
        }],
        subtotal: 26000,
        shippingFee: 600,
        discountAmount: 0,
        totalAmount: 26600,
        status: 'DELIVERED',
        createdAt: new Date('2026-09-20T10:30:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Sep 20, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Sep 21, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Sep 22, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Sep 24, 2026 - 11:30 AM', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88424',
        customerName: 'Engr. Albert Soriano',
        customerEmail: 'albert.soriano@davao-builders.ph',
        customerPhone: '09195554422',
        deliveryAddress: 'Buhangin Bypass Rd, Davao City',
        paymentMethod: 'Bank',
        gcashRefNumber: 'MBTC-772910',
        items: [{
            customId: 'prod-1',
            title: 'High-Strength Self-Leveling Mortar Repair System (25kg)',
            price: 2450,
            quantity: 8,
            total: 19600
        }],
        subtotal: 19600,
        shippingFee: 700,
        discountAmount: 0,
        totalAmount: 20300,
        status: 'DELIVERED',
        createdAt: new Date('2026-09-15T14:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Sep 15, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Metrobank Confirmed', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Sep 16, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Sep 17, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Sep 19, 2026', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88425',
        customerName: 'Grace Navarro',
        customerEmail: 'grace.navarro@bataan-co.ph',
        customerPhone: '09278883344',
        deliveryAddress: 'Roman Superhighway, Limay, Bataan',
        paymentMethod: 'GCash',
        gcashRefNumber: '339102938471',
        items: [{
            customId: 'prod-2',
            title: 'Epoxy Crack Injection Resin System (Complete Kit)',
            price: 3800,
            quantity: 4,
            total: 15200
        }],
        subtotal: 15200,
        shippingFee: 250,
        discountAmount: 0,
        totalAmount: 15450,
        status: 'DELIVERED',
        createdAt: new Date('2026-09-08T09:15:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Sep 8, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Sep 8, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Sep 9, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Sep 10, 2026', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88426',
        customerName: 'Engr. Richard Mercado',
        customerEmail: 'richard.mercado@cavite-express.ph',
        customerPhone: '09156667788',
        deliveryAddress: 'CAVITEX Plaza, Kawit, Cavite',
        paymentMethod: 'Maya',
        gcashRefNumber: 'MY-440192837',
        items: [{
            customId: 'prod-3',
            title: 'MegaFlow SP402 Concrete Superplasticizer Admixture (20L)',
            price: 4950,
            quantity: 8,
            total: 39600
        }],
        subtotal: 39600,
        shippingFee: 300,
        discountAmount: 500,
        discountType: 'ARCHON500',
        totalAmount: 39400,
        status: 'DELIVERED',
        createdAt: new Date('2026-08-25T11:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Aug 25, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Maya Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Aug 26, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Aug 26, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Aug 27, 2026', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88427',
        customerName: 'Engr. Carlos Mendoza',
        customerEmail: 'carlos.mendoza@dmci.com.ph',
        customerPhone: '09185551201',
        deliveryAddress: 'DMCI Compound, Pasong Tamo Ext., Makati City',
        paymentMethod: 'Bank',
        gcashRefNumber: 'BDO-TRX-102938',
        items: [{
            customId: 'prod-1',
            title: 'High-Strength Self-Leveling Mortar Repair System (25kg)',
            price: 2450,
            quantity: 15,
            total: 36750
        }],
        subtotal: 36750,
        shippingFee: 400,
        discountAmount: 0,
        totalAmount: 37150,
        status: 'DELIVERED',
        createdAt: new Date('2026-08-18T16:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Aug 18, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Aug 19, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Aug 20, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Aug 21, 2026', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88428',
        customerName: 'Engr. Eduardo Santos',
        customerEmail: 'eduardo.santos@eei.com.ph',
        customerPhone: '09178889923',
        deliveryAddress: 'EEI Main Office, Ortigas Ave., Pasig City',
        paymentMethod: 'Bank',
        gcashRefNumber: 'BPI-CORP-77182',
        items: [{
            customId: 'prod-5',
            title: 'MF3000 Concrete Pavement Road Additive (25kg Bag)',
            price: 3100,
            quantity: 6,
            total: 18600
        }],
        subtotal: 18600,
        shippingFee: 250,
        discountAmount: 0,
        totalAmount: 18850,
        status: 'DELIVERED',
        createdAt: new Date('2026-08-10T13:45:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Aug 10, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Aug 11, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Aug 12, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Aug 13, 2026', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88429',
        customerName: 'Arch. Maricel Reyes',
        customerEmail: 'maricel.reyes@megawide.com.ph',
        customerPhone: '09224443312',
        deliveryAddress: '20 N. Domingo St., Quezon City',
        paymentMethod: 'GCash',
        gcashRefNumber: '992019485721',
        items: [{
            customId: 'prod-4',
            title: 'Polymer Waterproofing Membrane Coating Sealant (10L)',
            price: 1850,
            quantity: 8,
            total: 14800
        }],
        subtotal: 14800,
        shippingFee: 200,
        discountAmount: 0,
        totalAmount: 15000,
        status: 'DELIVERED',
        createdAt: new Date('2026-08-02T10:15:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Aug 2, 2026', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Verified', done: true, isCancelled: false },
            { step: 'Factory Packed', time: 'Aug 3, 2026', done: true, isCancelled: false },
            { step: 'Out for Delivery', time: 'Aug 3, 2026', done: true, isCancelled: false },
            { step: 'Delivered', time: 'Aug 4, 2026', done: true, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88430',
        customerName: 'Engr. Kent Tagle',
        customerEmail: 'albioskent99@gmail.com',
        customerPhone: '09289876543',
        deliveryAddress: 'Lot 14 Blk 3 Mega Highway Depot, San Fernando, Pampanga',
        paymentMethod: 'COD',
        items: [{
            customId: 'prod-6',
            title: 'Rapid 24-Hour Concrete Accelerator Compound (15L)',
            price: 5200,
            quantity: 2,
            total: 10400
        }],
        subtotal: 10400,
        shippingFee: 150,
        discountAmount: 0,
        totalAmount: 10550,
        status: 'CONFIRMED',
        createdAt: new Date('2026-10-21T08:30:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 21, 2026 - 08:30 AM', done: true, isCancelled: false },
            { step: 'Payment Review', time: 'Pending Delivery COD', done: true, isCancelled: false },
            { step: 'Factory Packed', time: '', done: false, isCancelled: false },
            { step: 'Out for Delivery', time: '', done: false, isCancelled: false },
            { step: 'Delivered', time: '', done: false, isCancelled: false }
        ]
    },
    {
        orderNumber: 'AN-ORD-2026-88431',
        customerName: 'Ramon Bautista',
        customerEmail: 'ramon.bautista@makati-dev.ph',
        customerPhone: '09193338871',
        deliveryAddress: 'Ayala Triangle Tower, Ayala Ave., Makati City',
        paymentMethod: 'GCash',
        gcashRefNumber: '883920194857',
        items: [{
            customId: 'prod-2',
            title: 'Epoxy Crack Injection Resin System (Complete Kit)',
            price: 3800,
            quantity: 2,
            total: 7600
        }],
        subtotal: 7600,
        shippingFee: 150,
        discountAmount: 0,
        totalAmount: 7750,
        status: 'CANCELLED',
        cancelReason: 'Project scope deferred to Q1 2027',
        cancelledAt: new Date('2026-10-20T17:00:00Z'),
        createdAt: new Date('2026-10-20T14:00:00Z'),
        trackingTimeline: [
            { step: 'Order Placed', time: 'Oct 20, 2026', done: true, isCancelled: false },
            { step: 'Cancelled by customer', time: 'Oct 20, 2026 - 05:00 PM', done: true, isCancelled: true }
        ]
    }
];

const INITIAL_REVIEWS = [{
        productCustomId: 'prod-1',
        userName: 'Engr. Marco Santos',
        rating: 5,
        comment: 'Super fast curing! We reopened the tollway lane in less than 24 hours without any micro-cracking.',
        verified: true
    },
    {
        productCustomId: 'prod-1',
        userName: 'RF Flores Construction Staff',
        rating: 5,
        comment: 'Materials testing laboratory approved the core drill test results with 5500 psi. Highly recommended for rush highway paving.',
        verified: false
    },
    {
        productCustomId: 'prod-2',
        userName: 'Project Head Dela Cruz',
        rating: 5,
        comment: 'Deep penetration even on 0.2mm hairline fissures in pier columns. Easy nozzle applicator.',
        verified: false
    },
    {
        productCustomId: 'prod-3',
        userName: 'Batching Plant Manager Alvin',
        rating: 5,
        comment: 'Maintains 200mm slump for over 90 minutes during intense heat transit in Visayas. Excellent admixture.',
        verified: false
    }
];

// INITIAL SEED AUDIT LOGS
const INITIAL_AUDIT_LOGS = [{
        action: 'SYSTEM_SEED_INITIALIZED',
        performedBy: {
            email: 'system@archonnell.com',
            name: 'Archon Nell System',
            role: 'system'
        },
        target: 'MongoDB archon_nell_db',
        details: 'Initial database seeding executed with 6 products, 20 orders, and 16 user accounts.',
        ip: '127.0.0.1',
        userAgent: 'Archon Nell Seeder v1.1',
        createdAt: new Date('2026-10-21T07:00:00Z')
    },
    {
        action: 'LOGIN_2FA_SUCCESS',
        performedBy: {
            email: 'kentfloyd02@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'kentfloyd02@gmail.com',
        details: 'Successful 2FA OTP verification for role: ADMIN (Device trusted for 5 days)',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0',
        createdAt: new Date('2026-10-21T07:15:00Z')
    },
    {
        action: 'DELIVERY_STATUS_UPDATED',
        performedBy: {
            email: 'kentfloyd02@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'AN-ORD-2026-88412',
        details: 'Delivery status updated from PREPARING to IN_TRANSIT (Dispatched via Cainta Logistics)',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T07:30:00Z')
    },
    {
        action: 'LOGIN_TRUSTED_DEVICE',
        performedBy: {
            email: 'kentfloyd02@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'kentfloyd02@gmail.com',
        details: 'Successful login via 5-day trusted device (ADMIN) - OTP bypassed',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T08:00:00Z')
    },
    {
        action: 'LOGIN_2FA_SUCCESS',
        performedBy: {
            email: 'albioskent99@gmail.com',
            name: 'Engr. Kent Tagle',
            role: 'customer'
        },
        target: 'albioskent99@gmail.com',
        details: 'Successful 2FA OTP login (CUSTOMER) - Mega Infrastructure & Builders Corp.',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T08:25:00Z')
    },
    {
        action: 'ORDER_PLACED',
        performedBy: {
            email: 'albioskent99@gmail.com',
            name: 'Engr. Kent Tagle',
            role: 'customer'
        },
        target: 'AN-ORD-2026-88430',
        details: 'Order AN-ORD-2026-88430 placed for PHP 10,550.00 via COD',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T08:30:00Z')
    },
    {
        action: 'REFUND_STATUS_UPDATED',
        performedBy: {
            email: 'kentfloyd02@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'AN-ORD-2026-88422',
        details: 'Refund claim approved for order AN-ORD-2026-88422. Stock restocked to central warehouse.',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T09:00:00Z')
    },
    {
        action: 'STOCK_ADJUSTED',
        performedBy: {
            email: 'kentfloyd02@gmail.com',
            name: 'Archon Nell Administrator',
            role: 'admin'
        },
        target: 'prod-1',
        details: 'Warehouse inventory level adjusted (+20 units) for High-Strength Self-Leveling Mortar',
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2026-10-21T09:15:00Z')
    }
];

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

        // Insert Products
        await Product.insertMany(INITIAL_PRODUCTS);
        console.log(`Seeded ${INITIAL_PRODUCTS.length} products`);

        // Insert Projects
        await Project.insertMany(INITIAL_PROJECTS);
        console.log(`Seeded ${INITIAL_PROJECTS.length} projects`);

        // Insert Vouchers
        await Voucher.insertMany(INITIAL_VOUCHERS);
        console.log(`Seeded ${INITIAL_VOUCHERS.length} vouchers`);

        // Insert Users (using User.create so bcrypt pre-save runs)
        for (const u of INITIAL_USERS) {
            await User.create(u);
        }
        console.log(`Seeded ${INITIAL_USERS.length} registered users (admin + customers)`);

        // Insert Orders
        await Order.insertMany(INITIAL_ORDERS);
        console.log(`Seeded ${INITIAL_ORDERS.length} orders across 7 delivery statuses`);

        // Insert Reviews
        await Review.insertMany(INITIAL_REVIEWS);
        console.log(`Seeded ${INITIAL_REVIEWS.length} reviews`);

        // Insert Audit Logs
        await AuditLog.insertMany(INITIAL_AUDIT_LOGS);
        console.log(`Seeded ${INITIAL_AUDIT_LOGS.length} audit logs`);

        console.log('--- SEED COMPLETED SUCCESSFULLY! ---');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seedDatabase();