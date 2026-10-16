import { useState, useEffect, useMemo, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaLock, FaTruck, FaCreditCard, FaMoneyBillWave, FaShieldAlt,
  FaArrowRight, FaWallet, FaMapMarkerAlt, FaGlobeAmericas, FaCheckCircle, FaSave,
  FaWeightHanging, FaBoxOpen, FaInfoCircle, FaTicketAlt, FaTimes, FaEdit, FaTrash,
  FaStar, FaPlus, FaHome, FaBuilding, FaMapPin
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import { useCreateOrderMutation, usePayOrderWithWalletMutation } from '../slices/orderApiSlice';
import { useGetProfileQuery, useProfileMutation, useSendPhoneOtpMutation, useVerifyPhoneOtpMutation } from '../slices/usersApiSlice';
import { setSelectedLocation } from '../slices/locationSlice';
import { setAddresses } from '../slices/authSlice';
import { Country, State } from 'country-state-city';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import LoaderOverlay from '../components/LoaderOverlay';
import {
  useGetSavedAddressesQuery,
  useAddNewAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '../slices/addressesApiSlice';
import { formatAddressShort } from '../utils/formatAddress';
import { useGetMembershipQuery } from '../slices/eliteApiSlice';

const labelColors = {
  Home: 'bg-blue-100 text-blue-700 border-blue-200',
  Work: 'bg-purple-100 text-purple-700 border-purple-200',
  Office: 'bg-orange-100 text-orange-700 border-orange-200',
  Other: 'bg-gray-100 text-gray-600 border-gray-200',
};

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currencyCode = 'USD', rate = 1, countryCode: reduxCountryCode = 'US' } = useSelector((state) => state.currency || {});
  const { userInfo } = useSelector((state) => state.auth || { userInfo: null });
  const { currentLocation } = useSelector((state) => state.location || {});

  const { data: profile } = useGetProfileQuery();
  const [updateProfile] = useProfileMutation();
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [payOrderWithWallet, { isLoading: isPaying }] = usePayOrderWithWalletMutation();
  const [sendPhoneOtp] = useSendPhoneOtpMutation();
  const [verifyPhoneOtp, { isLoading: isVerifyingOtp }] = useVerifyPhoneOtpMutation();

  const { data: eliteMembership } = useGetMembershipQuery(undefined, { skip: !userInfo });
  const isElite = eliteMembership?.isElite;

  const { data: savedAddressesData = [], refetch: refetchAddresses } = useGetSavedAddressesQuery();
  const [addNewAddress, { isLoading: isAddingAddress }] = useAddNewAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const addresses = savedAddressesData.length > 0 ? savedAddressesData : (profile?.addresses || []);

  const [customerName, setCustomerName] = useState(userInfo?.name || '');
  const [selectedCountry, setSelectedCountry] = useState(reduxCountryCode || 'EG');
  const [phoneOnly, setPhoneOnly] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [streetDetails, setStreetDetails] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [shouldSaveAddress, setShouldSaveAddress] = useState(true);
  const [selectedCardId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingCostUSD, setShippingCostUSD] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isLocallyVerified, setIsLocallyVerified] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalEdit, setAddressModalEdit] = useState(false);
  const [addressModalEditId, setAddressModalEditId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', country: 'EG', state: '', city: '', district: '',
    building: '', apartment: '', addressLine: '', zipCode: '', addressLabel: 'Home',
    notes: '', isDefault: false,
  });

  // Format Currency Helper
  const formatCurrencyLocal = (amount) => {
    return `${currencyCode} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    if (reduxCountryCode) setSelectedCountry(reduxCountryCode);
  }, [reduxCountryCode]);

  const prevLocationRef = useRef(null);

  useEffect(() => {
    if (currentLocation?._id && currentLocation._id !== prevLocationRef.current) {
      setSelectedAddressId(null);
      prevLocationRef.current = currentLocation._id;
    }
  }, [currentLocation]);

  useEffect(() => {
    const locationAddr = addresses.find(addr => addr._id === currentLocation?._id);
    if (selectedAddressId) {
      if (locationAddr && selectedAddressId !== locationAddr._id) {
        setSelectedAddressId(null);
      } else {
        return;
      }
    }
    if (locationAddr) {
      handleSelectSavedAddress(locationAddr);
      return;
    }
    const defaultAddr = addresses.find(addr => addr.isDefault);
    if (defaultAddr) {
      handleSelectSavedAddress(defaultAddr);
    }
  }, [selectedCountry, addresses, currentLocation, selectedAddressId]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setCustomerName(addr.fullName || '');
    setPhoneOnly(addr.phone || '');
    setCity(addr.city || '');
    setArea(addr.district || '');
    setStreetDetails(addr.addressLine || '');
    setBuilding(addr.building || '');
    setApartment(addr.apartment || '');
    setState(addr.state || '');
    setZipCode(addr.zipCode || '');
    setAddressNotes(addr.notes || '');
    if (addr.country) setSelectedCountry(addr.country);
  };

  const deselectAddress = () => {
    setSelectedAddressId(null);
  };

  const getShippingEstimate = async () => {
    if (cartItems.length === 0) return;
    try {
      setIsCalculating(true);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(
        '/api/orders/shipping-estimate',
        { cartItems, countryCode: selectedCountry },
        config
      );
      setShippingCostUSD(data.shippingPrice || 0);
    } catch {
      setShippingCostUSD(0);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => { getShippingEstimate(); }, [cartItems, selectedCountry]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      setIsValidatingCoupon(true);
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(
        '/api/coupons/validate',
        { code: couponCode, cartItems: cartItems.map(item => ({...item, vendor: item.vendor || item.user})) },
        config
      );
      setAppliedCoupon(data);
      toast.success('Protocol Override Authorized! Coupon Applied.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid or unauthorized protocol code.');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const totalWeightKG = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const physical = Number(item.weight || 0);
      const volumetric = (Number(item.length || 0) * Number(item.width || 0) * Number(item.height || 0)) / 5000;
      return acc + (Math.max(physical, volumetric) * item.qty);
    }, 0);
  }, [cartItems]);

  const subtotalUSD = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.qty) * Number(item.price)), 0);
  }, [cartItems]);

  const couponDiscountUSD = useMemo(() => {
    if (!appliedCoupon) return 0;
    const val = appliedCoupon.data?.appliedDiscount || appliedCoupon.appliedDiscount || 0;
    return appliedCoupon.discountType === 'percentage' ? (subtotalUSD * val) / 100 : Number(val);
  }, [appliedCoupon, subtotalUSD]);

  const finalShippingCostUSD = totalWeightKG >= 500 ? shippingCostUSD * 0.8 : shippingCostUSD;
  const finalTotalUSD = subtotalUSD + finalShippingCostUSD - couponDiscountUSD;

  const convertedSubtotal = subtotalUSD * rate;
  const convertedShipping = finalShippingCostUSD * rate;
  const convertedDiscount = couponDiscountUSD * rate;
  const convertedTotal = finalTotalUSD * rate;

  const isHighValueOrder = finalTotalUSD >= 1000;
  const states = useMemo(() => State.getStatesOfCountry(selectedCountry), [selectedCountry]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 15) { setPhoneOnly(value); deselectAddress(); }
  };

  const handleRequestOtp = async () => {
    if (!phoneOnly) return;
    try {
      const countryObj = Country.getCountryByCode(selectedCountry);
      const fullPhoneNumber = `+${countryObj?.phonecode || '20'}${phoneOnly.replace(/^0+/, '')}`.trim();
      await sendPhoneOtp({ phone: fullPhoneNumber }).unwrap();
      setIsOtpSent(true);
      setOtpTimer(60);
    } catch { toast.error('OTP routing failed. Matrix error.'); }
  };

  const handleConfirmOtp = async () => {
    try {
      await verifyPhoneOtp({ otp: otpCode }).unwrap();
      setIsLocallyVerified(true);
      setIsOtpSent(false);
      toast.success('Channel Secured.');
    } catch { toast.error('Invalid signature sequence.'); }
  };

  // Address modal handlers
  const openAddAddressModal = () => {
    setAddressForm({
      fullName: customerName, phone: phoneOnly, country: selectedCountry,
      state: '', city: '', district: area, building: '', apartment: '',
      addressLine: streetDetails, zipCode: '', addressLabel: 'Home', notes: '', isDefault: false,
    });
    setAddressModalEdit(false);
    setAddressModalEditId(null);
    setShowAddressModal(true);
  };

  const openEditAddressModal = (addr) => {
    setAddressForm({
      fullName: addr.fullName || '', phone: addr.phone || '', country: addr.country || selectedCountry,
      state: addr.state || '', city: addr.city || '', district: addr.district || '',
      building: addr.building || '', apartment: addr.apartment || '',
      addressLine: addr.addressLine || '', zipCode: addr.zipCode || '',
      addressLabel: addr.addressLabel || 'Home', notes: addr.notes || '', isDefault: addr.isDefault || false,
    });
    setAddressModalEdit(true);
    setAddressModalEditId(addr._id);
    setShowAddressModal(true);
  };

  const handleSaveAddressFromModal = async (e) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine || !addressForm.city) {
      return toast.error('Please fill all required fields');
    }
    try {
      if (addressModalEdit) {
        await updateAddress({ id: addressModalEditId, ...addressForm }).unwrap();
        toast.success('Address updated');
      } else {
        await addNewAddress(addressForm).unwrap();
        toast.success('Address saved');
      }
      setShowAddressModal(false);
      refetchAddresses();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Remove this location from your saved addresses?')) return;
    try {
      await deleteAddress(id).unwrap();
      toast.info('Address removed');
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      refetchAddresses();
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await setDefaultAddress(id).unwrap();
      toast.success('Default address updated');
      refetchAddresses();
    } catch (err) {
      toast.error(err?.data?.message || 'Operation failed');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!customerName || !phoneOnly || !city || !streetDetails) {
      toast.error('Complete all critical matrix fields.');
      return;
    }
    setIsProcessing(true);
    try {
      const countryObj = Country.getCountryByCode(selectedCountry);
      const cleanPhone = phoneOnly.replace(/^0+/, '');
      const fullPhoneNumber = `+${countryObj?.phonecode || '20'}${cleanPhone}`.trim();

      const structuredAddress = {
        fullName: customerName,
        phone: fullPhoneNumber,
        addressLine: streetDetails,
        district: area,
        city,
        state,
        building,
        apartment,
        zipCode,
        country: selectedCountry,
        notes: addressNotes,
      };

      const fullAddress = `${streetDetails}, ${area}, ${city}, ${countryObj?.name || selectedCountry}`;

      const orderPayload = {
        orderItems: cartItems.map(item => ({ ...item, product: item._id, vendor: item.vendor || item.user })),
        customerName, phone: fullPhoneNumber, phoneNumber: fullPhoneNumber,
        address: structuredAddress,
        addressString: fullAddress,
        countryCode: selectedCountry, paymentMethod, itemsPrice: Number(subtotalUSD),
        shippingPrice: Number(finalShippingCostUSD), totalPrice: Number(finalTotalUSD),
        totalWeight: Number(totalWeightKG), discountPrice: Number(couponDiscountUSD),
        couponCode: appliedCoupon?.data?.code || appliedCoupon?.code || null,
        currency: currencyCode, exchangeRate: rate,
        savedCardId: paymentMethod === 'Stripe' ? selectedCardId : null,
        isEliteOrder: isElite,
      };

      const res = await createOrder(orderPayload).unwrap();
      const orderId = res._id || res.id;

      if (shouldSaveAddress && !selectedAddressId) {
        const newAddress = {
          fullName: customerName, phone: phoneOnly, city, district: area,
          addressLine: streetDetails, country: selectedCountry, state, building, apartment, zipCode,
          addressLabel: 'Home', notes: addressNotes,
        };
        const updatedProfile = await updateProfile({ addresses: [...addresses, newAddress] }).unwrap();
        const savedAddressesList = updatedProfile.addresses || [...addresses, newAddress];
        dispatch(setAddresses(savedAddressesList));
        const savedAddr = savedAddressesList[savedAddressesList.length - 1];
        if (savedAddr) dispatch(setSelectedLocation(savedAddr));
      }

      if (paymentMethod === 'Stripe') {
        if (res.url) window.location.href = res.url;
        else { clearCart(); navigate(`/success?orderId=${orderId}`); }
      } else {
        if (paymentMethod === 'Wallet') await payOrderWithWallet(orderId).unwrap();
        clearCart();
        navigate(`/success?orderId=${orderId}`);
      }
    } catch (error) {
      setIsProcessing(false);
      toast.error(error?.data?.message || 'Transaction dropped by node core.');
    }
  };

  const isFormInvalid = !customerName.trim() || !phoneOnly.trim() || !city.trim() || !streetDetails.trim();
  const isLoading = isCreating || isPaying || isProcessing;

  return (
    <div className="pt-24 pb-16 px-4 md:px-8 min-h-screen bg-gray-50 font-sans selection:bg-orange-100">
      <AnimatePresence>{isProcessing && <LoaderOverlay message="DEPLOYING ORDER COMPLIANCE..." />}</AnimatePresence>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
              SECURE <span className="text-orange-600 italic">CHECKOUT</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1 flex items-center gap-1.5">
              <FaShieldAlt className="text-emerald-500" /> Terminal Active • AES-256 Protocol
            </p>
          </div>
          <div className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center gap-2 shadow-sm self-start md:self-auto">
            <FaGlobeAmericas size={11} className="text-gray-400" />
            {Country.getCountryByCode(selectedCountry)?.name || 'Global'} Manifest
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Block: Logistics Inputs */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            <form onSubmit={handlePayment} className="space-y-6">

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <h2 className="text-sm font-black mb-6 uppercase tracking-wider text-gray-800 flex items-center gap-2">
                  <FaTruck className="text-orange-600" size={14} /> Logistics Despatch Terminal
                </h2>

                {/* AMAZON-STYLE SAVED ADDRESSES */}
                {addresses.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-orange-600" size={10} /> Saved Deployment Hubs ({addresses.length})
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-horizontal snap-x">
                      {addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className={`min-w-[220px] p-3 rounded-xl border cursor-pointer transition-all snap-start relative flex flex-col ${
                            selectedAddressId === addr._id
                              ? 'border-orange-500 bg-orange-50/30 shadow-sm ring-2 ring-orange-500/10'
                              : 'border-gray-200 bg-white/80 hover:border-orange-300 hover:shadow-sm'
                          }`}
                        >
                          {selectedAddressId === addr._id && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center shadow-md">
                              <FaCheckCircle className="text-white text-[8px]" />
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="font-black text-[10px] uppercase truncate pr-4 text-gray-800">{addr.fullName}</p>
                            {addr.addressLabel && (
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border uppercase ${labelColors[addr.addressLabel] || labelColors.Other}`}>
                                {addr.addressLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-500 leading-tight line-clamp-2">{formatAddressShort(addr)}</p>
                          <p className="text-[8px] text-orange-600 font-black uppercase tracking-wider mt-1">{addr.city}{addr.state ? `, ${addr.state}` : ''}</p>
                          {addr.isDefault && (
                            <span className="absolute top-1 left-1 text-[7px] font-black bg-gray-950 text-orange-400 px-1.5 py-0.5 rounded uppercase tracking-wider">PRIMARY</span>
                          )}
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleSelectSavedAddress(addr); }}
                              className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                selectedAddressId === addr._id
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white'
                              }`}
                            >
                              Deliver here
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditAddressModal(addr); }}
                              className="p-1.5 text-gray-400 hover:text-orange-600 bg-gray-100 hover:bg-orange-50 rounded-lg transition-all"
                            >
                              <FaEdit size={9} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <FaTrash size={9} />
                            </button>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleSetDefaultAddress(addr._id); }}
                                className="p-1.5 text-gray-400 hover:text-amber-500 bg-gray-100 hover:bg-amber-50 rounded-lg transition-all"
                                title="Set as default"
                              >
                                <FaStar size={9} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Address Button */}
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="mb-6 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-orange-500 rounded-xl text-[9px] font-black text-gray-400 hover:text-orange-600 uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-gray-50/50 hover:bg-orange-50/30"
                >
                  <FaPlus size={9} /> Add New Address
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Full Legal Name</label>
                    <input type="text" placeholder="e.g. Mohamed Elattar" className="w-full p-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 rounded-xl transition-all outline-none font-bold text-xs text-gray-800" value={customerName} onChange={(e) => { setCustomerName(e.target.value); deselectAddress(); }} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Country / Region</label>
                    <div className="w-full p-3 bg-zinc-950 text-white border border-zinc-950 rounded-xl font-black text-xs flex items-center justify-between shadow-sm">
                      <span>{Country.getCountryByCode(selectedCountry)?.name || selectedCountry}</span>
                      <span className="text-[10px] opacity-40">🔒</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Secure Contact</label>
                    <div className="flex items-stretch bg-gray-50 border border-gray-200 focus-within:border-orange-500 focus-within:bg-white rounded-xl transition-all shadow-inner relative overflow-hidden h-[42px]">
                      <div className="bg-zinc-900 text-white px-3 flex items-center font-mono font-black text-[11px] select-none">
                        +{Country.getCountryByCode(selectedCountry)?.phonecode || ''}
                      </div>
                      <input type="tel" placeholder="Mobile number" className="w-full h-full px-3 bg-transparent outline-none font-bold text-xs text-gray-800 pr-16" value={phoneOnly} onChange={handlePhoneChange} />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {(profile?.isPhoneVerified || isLocallyVerified) ? (
                          <span className="text-emerald-600 text-[9px] font-black uppercase flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">Verified</span>
                        ) : (
                          !isOtpSent && <button type="button" onClick={handleRequestOtp} disabled={!phoneOnly} className="bg-gray-200 hover:bg-orange-600 hover:text-white text-gray-700 font-black px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider transition-all">Verify</button>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOtpSent && !profile?.isPhoneVerified && !isLocallyVerified && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2 flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 shadow-xl">
                        <input type="text" placeholder="6-Digit OTP Protocol" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-center font-mono font-black text-xs text-white focus:outline-none focus:border-orange-500" />
                        <button type="button" onClick={handleConfirmOtp} disabled={isVerifyingOtp || !otpCode} className="bg-orange-600 hover:bg-orange-700 text-white font-black px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-all">
                          {isVerifyingOtp ? '...' : 'Confirm'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">City / State</label>
                    <div className="relative">
                      <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-xs cursor-pointer transition-all appearance-none text-gray-800" value={city} onChange={(e) => { setCity(e.target.value); deselectAddress(); }}>
                        <option value="">Select Region</option>
                        {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                      </select>
                      <FaMapMarkerAlt size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">District / Area</label>
                    <input type="text" placeholder="e.g. First Mit Talkha" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-xs text-gray-800 transition-all" value={area} onChange={(e) => { setArea(e.target.value); deselectAddress(); }} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Building No.</label>
                    <input type="text" placeholder="e.g. 15" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-xs text-gray-800 transition-all" value={building} onChange={(e) => { setBuilding(e.target.value); deselectAddress(); }} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Apartment / Suite</label>
                    <input type="text" placeholder="e.g. 3rd Floor" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-xs text-gray-800 transition-all" value={apartment} onChange={(e) => { setApartment(e.target.value); deselectAddress(); }} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Full Street Address</label>
                    <textarea placeholder="Building, Floor, Apartment, Street Details..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-20 focus:bg-white focus:border-orange-500 transition-all outline-none resize-none font-bold text-xs text-gray-800" value={streetDetails} onChange={(e) => { setStreetDetails(e.target.value); deselectAddress(); }}></textarea>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">ZIP / Postal Code</label>
                    <input type="text" placeholder="e.g. 12345" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-xs text-gray-800 transition-all" value={zipCode} onChange={(e) => { setZipCode(e.target.value); deselectAddress(); }} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">State / Province</label>
                    <input type="text" placeholder="e.g. California" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-orange-500 outline-none font-bold text-xs text-gray-800 transition-all" value={state} onChange={(e) => { setState(e.target.value); deselectAddress(); }} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-[0.15em]">Delivery Notes (optional)</label>
                    <textarea placeholder="Special instructions for delivery..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-16 focus:bg-white focus:border-orange-500 transition-all outline-none resize-none font-bold text-xs text-gray-800" value={addressNotes} onChange={(e) => { setAddressNotes(e.target.value); deselectAddress(); }}></textarea>
                  </div>
                </div>

                {!selectedAddressId && (
                  <div onClick={() => setShouldSaveAddress(!shouldSaveAddress)} className="mt-4 flex items-center gap-2 p-2.5 bg-orange-50/40 rounded-xl border border-orange-100/60 cursor-pointer select-none">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${shouldSaveAddress ? 'bg-orange-600 border-orange-600' : 'bg-white border-gray-300'}`}>
                      {shouldSaveAddress && <FaCheckCircle className="text-white text-[8px]" />}
                    </div>
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5"><FaSave className="text-orange-600" /> Save address terminal variables</span>
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-sm font-black mb-6 uppercase tracking-wider text-gray-800 flex items-center gap-2">
                  <FaLock className="text-orange-600" size={12} /> Secure Settlement Node
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div onClick={() => setPaymentMethod('Stripe')} className={`cursor-pointer p-4 border rounded-xl flex flex-col justify-between h-24 transition-all ${paymentMethod === 'Stripe' ? 'border-orange-600 bg-orange-50/30 shadow-sm' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                      <FaCreditCard size={20} className={paymentMethod === 'Stripe' ? 'text-orange-600' : 'text-gray-400'} />
                      {paymentMethod === 'Stripe' && <div className="w-2.5 h-2.5 bg-orange-600 rounded-full"></div>}
                    </div>
                    <div><p className="font-black text-xs text-gray-900 uppercase tracking-tight">Credit Card</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Stripe secure</p></div>
                  </div>

                  <div onClick={() => profile?.storeCredit >= finalTotalUSD && setPaymentMethod('Wallet')} className={`cursor-pointer p-4 border rounded-xl flex flex-col justify-between h-24 transition-all ${paymentMethod === 'Wallet' ? 'border-orange-600 bg-orange-50/30 shadow-sm' : (profile?.storeCredit < finalTotalUSD ? 'opacity-30 grayscale pointer-events-none' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200')}`}>
                    <div className="flex justify-between items-start">
                      <FaWallet size={20} className={paymentMethod === 'Wallet' ? 'text-orange-600' : 'text-gray-400'} />
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-900 text-white">{formatCurrencyLocal(profile?.storeCredit || 0)}</span>
                    </div>
                    <div><p className="font-black text-xs text-gray-900 uppercase tracking-tight">Hardware Credit</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Wallet Ledger</p></div>
                  </div>

                  <div onClick={() => !isHighValueOrder && setPaymentMethod('COD')} className={`cursor-pointer p-4 border rounded-xl flex flex-col justify-between h-24 transition-all ${isHighValueOrder ? 'bg-gray-100 opacity-40 grayscale pointer-events-none' : (paymentMethod === 'COD' ? 'border-orange-600 bg-orange-50/30 shadow-sm' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200')}`}>
                    <div className="flex justify-between items-start">
                      <FaMoneyBillWave size={20} className={paymentMethod === 'COD' ? 'text-orange-600' : 'text-gray-400'} />
                      {isHighValueOrder && <span className="text-[7px] font-black bg-red-100 text-red-600 px-1 py-0.5 rounded uppercase">Limit Exceeded</span>}
                    </div>
                    <div><p className="font-black text-xs text-gray-900 uppercase tracking-tight">Doorstep COD</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Cash On Arrival</p></div>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isFormInvalid || isCalculating || isLoading || isVerifyingOtp || (!profile?.isPhoneVerified && !isLocallyVerified)} loading={isLoading} variant="primary" size="full" className="py-4 rounded-xl uppercase tracking-widest shadow-md">
                {isLoading ? 'Processing...' : <>DEPLOY CHECKOUT PROCESS <FaArrowRight size={12} /></>}
              </Button>
            </form>
          </div>

          {/* Right Side: Heavy-Duty Logistics Hub Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 order-1 lg:order-2 w-full">
            <div className="relative bg-[#0d1117] text-white p-5 md:p-6 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
              <div className="flex justify-between items-start mb-5 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-md font-black tracking-tight uppercase leading-none text-zinc-100">CARGO <span className="text-orange-500 italic">VAULT</span></h2>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Certified Manifest</p>
                </div>
                <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg text-[8px] font-black tracking-wider uppercase flex items-center gap-1">
                  <FaBoxOpen size={9} /> {cartItems.length} Units
                </div>
              </div>

              {isElite && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
                  <FaGem className="text-amber-400 shrink-0" size={14} />
                  <div>
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">DK-TEC ELITE Member</p>
                    <p className="text-[8px] text-zinc-400 font-bold">Enjoying free shipping & 20% off</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[180px] overflow-y-auto mb-5 pr-1 custom-summary-scrollbar">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex gap-3 items-center p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <div className="relative shrink-0 w-12 h-12 bg-black rounded-lg overflow-hidden border border-zinc-800 p-1 flex items-center justify-center">
                      <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-contain mix-blend-screen" />
                      <div className="absolute -top-0.5 -right-0.5 bg-orange-600 text-white text-[7px] font-black w-4 h-4 flex items-center justify-center rounded border border-black shadow-md">{item.qty}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-wide truncate mb-0.5">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-black text-xs tracking-tight">{formatCurrencyLocal(item.price * rate)}</span>
                        <span className="h-1 w-1 bg-zinc-700 rounded-full"></span>
                        <span className="text-[8px] text-zinc-500 font-bold flex items-center gap-0.5 uppercase"><FaWeightHanging size={7} className="text-orange-500" /> {item.weight} KG</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 mb-2 px-1"><FaTicketAlt size={10} className="text-orange-500" /><span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Security Voucher Authorization</span></div>
                <AnimatePresence mode="wait">
                  {!appliedCoupon ? (
                    <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-orange-500/40 transition-all shadow-inner">
                      <input type="text" placeholder="ENTER PROTOCOL CODE..." value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="bg-transparent border-none focus:ring-0 text-[10px] font-black tracking-wider text-orange-500 placeholder:text-zinc-700 px-2 flex-1 outline-none" />
                      <button type="button" onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode} className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white text-[8px] font-black px-3 py-1.5 rounded-lg transition-all">AUTHORIZE</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle size={12} className="text-emerald-500" />
                        <div><p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{appliedCoupon?.data?.code || appliedCoupon?.code}</p><p className="text-[7px] text-zinc-500 font-bold uppercase">AUTHORIZED REBATE</p></div>
                      </div>
                      <button type="button" onClick={removeCoupon} className="p-1 text-zinc-600 hover:text-red-400 transition-colors"><FaTimes size={10} /></button>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4 pt-1">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60">
                  <div className="flex justify-between items-center mb-2 px-0.5"><span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">PAYLOAD LOADOUT</span><span className="text-[9px] font-black text-orange-500 italic">{totalWeightKG.toFixed(1)} / 1000 KG</span></div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-orange-600" style={{ width: `${Math.min((totalWeightKG / 1000) * 100, 100)}%` }} /></div>
                </div>

                <div className="space-y-2.5 text-xs px-1">
                  <div className="flex justify-between items-center"><span className="text-zinc-500 font-black text-[9px] uppercase tracking-wider">GROSS SUBTOTAL</span><span className="text-zinc-300 font-black tracking-tight">{formatCurrencyLocal(convertedSubtotal)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-500 font-black text-[9px] uppercase tracking-wider">SHIPPING UNIT</span><span className="text-zinc-300 font-black tracking-tight">{isElite ? <span className="text-emerald-400">FREE</span> : (isCalculating ? "..." : `+ ${formatCurrencyLocal(convertedShipping)}`)}</span></div>
                  {convertedDiscount > 0 && <div className="flex justify-between items-center bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10"><span className="text-emerald-500 font-black text-[8px] uppercase tracking-wider">LOGISTICS REBATE</span><span className="text-emerald-500 font-black text-xs">-{formatCurrencyLocal(convertedDiscount)}</span></div>}
                  {isElite && <div className="flex justify-between items-center bg-amber-500/10 p-2 rounded-lg border border-amber-500/20"><span className="text-amber-400 font-black text-[8px] uppercase tracking-wider flex items-center gap-1"><FaGem size={8} /> ELITE SAVINGS</span><span className="text-amber-400 font-black text-xs">-{formatCurrencyLocal(subtotalUSD * 0.2 * rate)}</span></div>}
                </div>

                <div className="relative mt-4 p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 flex flex-col items-center justify-center text-center">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">FINAL INVESTMENT DISPLAY</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-zinc-600 text-[10px] font-black uppercase">{currencyCode}</span>
                    <h3 className="font-black text-orange-500 text-2xl tracking-tighter italic">
                      {isCalculating ? "---" : (convertedTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal (Add / Edit) */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 relative my-auto max-h-[90vh] overflow-y-auto box-border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">
                    {addressModalEdit ? 'Edit' : 'Add'} <span className="text-orange-600">Address</span>
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Shipping Destination</p>
                </div>
                <button onClick={() => setShowAddressModal(false)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-50 transition-all">
                  <FaTimes size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAddressFromModal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Full Name *</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Phone *</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="Phone Number" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Country</label>
                    <select className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}>
                      <option value="EG">Egypt</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="AE">UAE</option>
                      <option value="KW">Kuwait</option>
                      <option value="QA">Qatar</option>
                      <option value="BH">Bahrain</option>
                      <option value="OM">Oman</option>
                      <option value="JO">Jordan</option>
                      <option value="LB">Lebanon</option>
                      <option value="PS">Palestine</option>
                      <option value="IQ">Iraq</option>
                      <option value="YE">Yemen</option>
                      <option value="LY">Libya</option>
                      <option value="SD">Sudan</option>
                      <option value="TN">Tunisia</option>
                      <option value="DZ">Algeria</option>
                      <option value="MA">Morocco</option>
                      <option value="TR">Turkey</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="IT">Italy</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Address Label</label>
                    <select className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" value={addressForm.addressLabel} onChange={(e) => setAddressForm({ ...addressForm, addressLabel: e.target.value })}>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">City *</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">State</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">District</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="District/Area" value={addressForm.district} onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">ZIP Code</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="ZIP" value={addressForm.zipCode} onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Building</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="Building No." value={addressForm.building} onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Apartment</label>
                    <input className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all" placeholder="Apartment" value={addressForm.apartment} onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Street Address *</label>
                  <textarea className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[70px] resize-none" placeholder="Street address" value={addressForm.addressLine} onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })} />
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block ml-1 mb-1">Delivery Notes</label>
                  <textarea className="w-full bg-gray-50 border border-gray-200/80 p-3 rounded-xl text-gray-900 text-xs font-bold focus:border-orange-500 focus:bg-white outline-none transition-all min-h-[50px] resize-none" placeholder="Optional notes" value={addressForm.notes} onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })} />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="modalIsDefault" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                  <label htmlFor="modalIsDefault" className="text-[10px] font-black text-gray-600 uppercase tracking-wider">Set as default</label>
                </div>

                <button type="submit" disabled={isAddingAddress || isUpdatingAddress} className="w-full bg-gray-950 hover:bg-orange-600 p-4 rounded-xl text-white font-bold uppercase text-xs tracking-wider transition-all duration-300 shadow-md disabled:opacity-40">
                  {isAddingAddress || isUpdatingAddress ? 'Saving...' : (addressModalEdit ? 'Update Address' : 'Save Address')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-summary-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-summary-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar-horizontal::-webkit-scrollbar { height: 3px; }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default Checkout;
