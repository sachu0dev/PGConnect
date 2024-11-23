"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  StandaloneSearchBox,
  Marker,
} from "@react-google-maps/api";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { pgFormSchema } from "@/schemas/pgFromSchema";
import { z } from "zod";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

const AddressForm = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const markerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    city: "",
    address: "",
    rentPerMonth: "",
    gender: "male",
    isDummy: false,
    coordinates: "",
    bhk: "1",
    capacity: "",
    capacityCount: "",
    description: "",
    isAcceptingGuest: true,
    images: [],
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places", "maps"],
  });

  const fetchAddress = useCallback(async () => {
    const { lat, lng } = center;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === "OK") {
      const locationAddress = data.results[0]?.formatted_address || "";
      const addressComponents = data.results[0]?.address_components || [];

      const cityComponent = addressComponents.find((comp) =>
        comp.types.includes("locality")
      )?.long_name;

      setAddress(locationAddress);
      setCity(cityComponent || "Unknown City");

      setFormData((prev) => ({
        ...prev,
        city: cityComponent || "Unknown City",
        address: locationAddress,
        coordinates: `${lat},${lng}`,
      }));
    }
  }, [center]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => fetchAddress(), 500);
    return () => clearTimeout(debounceTimeout);
  }, [center, fetchAddress]);

  const handleMapDragEnd = () => {
    const newCenter = {
      lat: mapRef.current.getCenter().lat(),
      lng: mapRef.current.getCenter().lng(),
    };
    setCenter(newCenter);
  };

  const handlePlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces();
    if (places && places.length > 0) {
      const location = places[0].geometry.location;
      const newCenter = {
        lat: location.lat(),
        lng: location.lng(),
      };
      setCenter(newCenter);
    }
  };

  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter({ lat: latitude, lng: longitude });
      },
      (error) => toast("Error getting location"),
      { enableHighAccuracy: true }
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length < 3 || files.length > 8) {
      toast("You must upload between 3 and 8 images");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: files.map((file) => file.name), // Mocking file names here
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    if (type === "number") {
      finalValue = value === "" ? "" : Number(value);
    } else if (type === "checkbox") {
      finalValue = checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.city !== city) {
      toast("Selected location doesn't match the form city");
      return;
    }

    try {
      console.log(formData);

      const parsedData = pgFormSchema.parse(formData);

      const response = await fetch("/api/pg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...parsedData,
          rentPerMonth: Number(parsedData.rentPerMonth),
          capacity: Number(parsedData.capacity),
          bhk: parsedData.bhk === "4+" ? 4 : Number(parsedData.bhk),
          capacityCount: Number(parsedData.capacityCount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast("PG created successfully!");
        setFormData({
          name: "",
          contact: "",
          city: "",
          address: "",
          rentPerMonth: "",
          gender: "male",
          isDummy: false,
          coordinates: "",
          bhk: "1",
          capacity: "",
          capacityCount: "",
          description: "",
          isAcceptingGuest: true,
          images: [],
        });
      } else {
        toast(data.error || "Failed to create PG");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast(error.errors[0]?.message || "Validation error");
      } else {
        console.error("Error creating PG:", error);
        toast("Something went wrong!");
      }
    }
  };

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className="p-4 max-w-[800px] mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Create a New PG</h1>

      <div className="relative mb-4">
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

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={(map) => (mapRef.current = map)}
          onDragEnd={handleMapDragEnd}
        >
          <Marker position={center} ref={markerRef} />
        </GoogleMap>

        <button
          onClick={handleUseCurrentLocation}
          className="absolute bottom-4 right-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded"
        >
          <LocateFixed className="mr-2" /> Use Current Location
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block font-medium">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="contact" className="block font-medium">
              Contact
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="city" className="block font-medium">
              City
            </label>
            <input
              type="text"
              id="city"
              value={city}
              readOnly
              className="w-full mt-1 p-2 border rounded bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="bhk" className="block font-medium">
              BHK
            </label>
            <input
              type="number"
              id="bhk"
              name="bhk"
              value={formData.bhk}
              onChange={handleChange}
              required
              min="1"
              className="w-full mt-1 p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block font-medium">
              Total Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              className="w-full mt-1 p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="rentPerMonth" className="block font-medium">
              Rent per Month
            </label>
            <input
              type="number"
              id="rentPerMonth"
              name="rentPerMonth"
              value={formData.rentPerMonth}
              onChange={handleChange}
              required
              min="0"
              className="w-full mt-1 p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block font-medium">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={address}
            readOnly
            className="w-full mt-1 p-2 border rounded bg-gray-50"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="description" className="block font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
            rows={4}
          />
        </div>

        <div>
          <label htmlFor="images" className="block font-medium">
            Images
          </label>
          <input
            type="file"
            id="images"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full mt-1 p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="gender" className="block font-medium">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="any">Any</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDummy"
              name="isDummy"
              checked={formData.isDummy}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="isDummy" className="font-medium">
              Is Dummy?
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAcceptingGuest"
              name="isAcceptingGuest"
              checked={formData.isAcceptingGuest}
              onChange={handleChange}
              className="rounded"
            />
            <label htmlFor="isAcceptingGuest" className="font-medium">
              Accepting Guests?
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create PG
        </button>
      </form>
    </div>
  );
};

export default AddressForm;
