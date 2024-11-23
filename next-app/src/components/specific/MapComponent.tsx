import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import { ArrowLeft, LocateFixed, Plus, X } from "lucide-react";
import Image from "next/image";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

const AddressModal = ({
  isOpen,
  onClose,
  onAddressSelect,
  addresses,
  selectedAddress,
  setSelectedAddress,
}) => {
  const [center, setCenter] = useState(defaultCenter);
  const [location, setLocation] = useState(null);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [completeAddress, setCompleteAddress] = useState("");
  const [sector, setSector] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [formMode, setFormMode] = useState("select");
  const [addressLabel, setAddressLabel] = useState("");

  const handleAddressChange = (address) => {
    setSelectedAddress(address);
  };

  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "maps"],
  });

  const fetchAddress = useCallback(async () => {
    const { lat, lng } = center;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const locationAddress = data.results[0].formatted_address;
      const addressComponents = data.results[0].address_components;

      addressComponents.forEach((component) => {
        if (component.types.includes("country")) {
          setCountry(component.long_name);
        } else if (component.types.includes("administrative_area_level_1")) {
          setState(component.long_name);
        } else if (component.types.includes("locality")) {
          setCity(component.long_name);
        } else if (component.types.includes("postal_code")) {
          setPostalCode(component.long_name);
        }
      });

      setLocation({ lat, lng, address: locationAddress });
      // Set a default address label based on city and country
      setAddressLabel(`${city || ""}, ${country || ""}`.trim());
    }
  }, [center]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchAddress();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [center, fetchAddress]);

  const handleMapDragEnd = () => {
    const newCenter = {
      lat: mapRef.current.getCenter().lat(),
      lng: mapRef.current.getCenter().lng(),
    };
    setCenter(newCenter);
  };

  const onLoad = (map) => {
    mapRef.current = map;
  };

  const handlePlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces();
    if (places && places.length > 0) {
      const place = places[0];
      const location = place.geometry.location;
      setCenter({
        lat: location.lat(),
        lng: location.lng(),
      });
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (location) {
      const newAddress = {
        ...location,
        country,
        state,
        city,
        postalCode,
        completeAddress,
        sector,
        label: addressLabel,
      };

      onAddressSelect(newAddress);
      setFormMode("select");
    }
  };

  const handleClose = () => {
    setFormMode("select");
    onClose();
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter({ lat: latitude, lng: longitude });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
  };

  const handleCompleteAddressChange = (e) => setCompleteAddress(e.target.value);
  const handleSectorChange = (e) => setSector(e.target.value);
  const handleAddressLabelChange = (e) => setAddressLabel(e.target.value);

  if (!isLoaded || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-3/4 lg:w-1/2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Select an Address</h1>
          <button onClick={handleClose} className="text-gray-500">
            <X />
          </button>
        </div>
        {formMode === "select" && (
          <div className="relative">
            <div className="my-4 w-full flex justify-center">
              {addresses.length > 0 && (
                <div className="mt-4 bg-gray-100 p-4 rounded shadow-md w-full max-w-md text-left">
                  <h2 className="text-xl font-semibold mb-2">
                    Saved Addresses
                  </h2>
                  <ul className="space-y-2">
                    {addresses.map((address, index) => (
                      <li
                        key={index}
                        className={`p-2 border rounded cursor-pointer ${
                          selectedAddress === address
                            ? "border-2 border-blue-600"
                            : "border-gray-300"
                        }`}
                        onClick={() => handleAddressChange(address)}
                      >
                        <p>
                          <strong>Complete Address:</strong>{" "}
                          {address.completeAddress}
                        </p>
                        <p>
                          <strong>Sector:</strong> {address.sector}
                        </p>
                        <p>
                          <strong>City:</strong> {address.city}
                        </p>
                        <p>
                          <strong>State:</strong> {address.state}
                        </p>
                        <p>
                          <strong>Country:</strong> {address.country}
                        </p>
                        <p>
                          <strong>Postal Code:</strong> {address.postalCode}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setFormMode("map")}
              className="bg-gray-100 text-black w-full flex space-x-4 px-4 py-2 rounded"
            >
              <Plus /> <span>Add address</span>
            </button>
          </div>
        )}
        {formMode === "map" && (
          <>
            <button
              onClick={() => setFormMode("select")}
              className="bg-gray-100 text-black w-full flex space-x-4 px-4 py-2 rounded mb-4"
            >
              <ArrowLeft /> <span>Back</span>
            </button>
            <div className="relative">
              <div className="absolute top-10 left-0 right-0 flex flex-col gap-2 z-10 p-4">
                <StandaloneSearchBox
                  onLoad={(ref) => (searchBoxRef.current = ref)}
                  onPlacesChanged={handlePlacesChanged}
                >
                  <input
                    type="text"
                    placeholder="Search for a location"
                    className="w-full p-2 border rounded"
                  />
                </StandaloneSearchBox>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 z-10 p-4">
                <button
                  onClick={handleUseCurrentLocation}
                  className="bg-white text-red-500 flex space-x-4 px-4 py-2 rounded"
                >
                  <LocateFixed /> <span>Use Current Location</span>
                </button>
              </div>

              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={12}
                onLoad={onLoad}
                onDragEnd={handleMapDragEnd}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -100%)",
                    color: "red",
                    fontSize: "24px",
                  }}
                >
                  <Image
                    src="map-pin.svg"
                    alt="Marker"
                    width={20}
                    height={20}
                    className="w-6 h-6"
                  />
                </div>
              </GoogleMap>
            </div>

            {location && (
              <div className="mt-4 bg-gray-100 p-4 rounded-md flex justify-evenly">
                <p>
                  <strong>City:</strong> {city || "N/A"}
                </p>
                <p>
                  <strong>Country:</strong> {country || "N/A"}
                </p>
                <p>
                  <strong>Postal Code:</strong> {postalCode || "N/A"}
                </p>
              </div>
            )}

            <button
              onClick={() => setFormMode("addmore")}
              className="bg-green-600 w-full text-white px-4 py-2 mt-4 rounded"
            >
              Add more address details
            </button>
          </>
        )}
        {formMode === "addmore" && (
          <div className="relative">
            <span>Save address as *</span>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Home, Office, etc"
                className="w-full p-2 border rounded"
                value={addressLabel}
                onChange={handleAddressLabelChange}
              />
              <button
                onClick={() => setFormMode("map")}
                className="bg-gray-100 absolute z-10 text-black right-0 top-0 flex space-x-4 px-4 py-2 rounded"
              >
                <span>Change</span>
              </button>
              <span className="text-gray-500 text-sm">
                Updated based on your exact map pin
              </span>
            </div>
            <input
              type="text"
              placeholder="Complete Address"
              className="w-full p-2 border rounded mb-4"
              value={completeAddress}
              onChange={handleCompleteAddressChange}
            />
            <input
              type="text"
              placeholder="Sector / Colony / Street"
              className="w-full p-2 border rounded mb-4"
              value={sector}
              onChange={handleSectorChange}
            />
            <button
              onClick={handleConfirm}
              className="bg-green-600 w-full text-white px-4 py-2 mt-4 rounded"
            >
              Confirm Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressModal;
