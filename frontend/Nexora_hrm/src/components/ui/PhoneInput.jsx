import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, AlertCircle, Search } from "lucide-react";
import { C } from "../../constants/theme";

export const COUNTRIES = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", length: 10, placeholder: "98765 43210", regex: /^[6-9]\d{9}$/ },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", length: 10, placeholder: "555 123 4567", regex: /^\d{10}$/ },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", length: 10, placeholder: "7911 123456", regex: /^\d{10,11}$/ },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", length: 10, placeholder: "555 123 4567", regex: /^\d{10}$/ },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", length: 9, placeholder: "412 345 678", regex: /^\d{9}$/ },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", length: 9, placeholder: "50 123 4567", regex: /^\d{9}$/ },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", length: 9, placeholder: "50 123 4567", regex: /^\d{9}$/ },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", length: 8, placeholder: "8123 4567", regex: /^\d{8}$/ },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", length: 11, placeholder: "151 23456789", regex: /^\d{10,11}$/ },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", length: 9, placeholder: "6 12 34 56 78", regex: /^\d{9}$/ },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", length: 10, placeholder: "90 1234 5678", regex: /^\d{10}$/ },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳", length: 11, placeholder: "138 0013 8000", regex: /^\d{11}$/ },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", length: 11, placeholder: "11 91234 5678", regex: /^\d{10,11}$/ },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", length: 9, placeholder: "82 123 4567", regex: /^\d{9}$/ },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺", length: 10, placeholder: "912 345 67 89", regex: /^\d{10}$/ },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", length: 10, placeholder: "1712 345678", regex: /^\d{10}$/ },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", length: 10, placeholder: "300 1234567", regex: /^\d{10}$/ },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", length: 9, placeholder: "71 234 5678", regex: /^\d{9}$/ },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵", length: 10, placeholder: "984 1234567", regex: /^\d{10}$/ },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", length: 10, placeholder: "12 345 6789", regex: /^\d{9,10}$/ },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", length: 10, placeholder: "917 123 4567", regex: /^\d{10}$/ },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", length: 11, placeholder: "812 3456 7890", regex: /^\d{10,12}$/ },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", length: 9, placeholder: "21 123 4567", regex: /^\d{9,10}$/ },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", length: 8, placeholder: "3312 3456", regex: /^\d{8}$/ },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼", length: 8, placeholder: "9123 4567", regex: /^\d{8}$/ },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", length: 8, placeholder: "9123 4567", regex: /^\d{8}$/ },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭", length: 8, placeholder: "3912 3456", regex: /^\d{8}$/ },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", length: 10, placeholder: "312 345 6789", regex: /^\d{10}$/ },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", length: 9, placeholder: "612 34 56 78", regex: /^\d{9}$/ },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", length: 9, placeholder: "6 12345678", regex: /^\d{9}$/ },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", length: 9, placeholder: "79 123 45 67", regex: /^\d{9}$/ },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", length: 9, placeholder: "70 123 45 67", regex: /^\d{9}$/ },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴", length: 8, placeholder: "412 34 567", regex: /^\d{8}$/ },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰", length: 8, placeholder: "21 23 45 67", regex: /^\d{8}$/ },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", length: 9, placeholder: "83 123 4567", regex: /^\d{9}$/ },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽", length: 10, placeholder: "55 1234 5678", regex: /^\d{10}$/ },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", length: 10, placeholder: "802 123 4567", regex: /^\d{10}$/ },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", length: 9, placeholder: "712 345678", regex: /^\d{9}$/ },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", length: 10, placeholder: "10 1234 5678", regex: /^\d{10}$/ },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷", length: 10, placeholder: "532 123 45 67", regex: /^\d{10}$/ },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷", length: 10, placeholder: "10 1234 5678", regex: /^\d{9,10}$/ },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭", length: 9, placeholder: "81 234 5678", regex: /^\d{9}$/ },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳", length: 9, placeholder: "91 234 56 78", regex: /^\d{9,10}$/ },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰", length: 8, placeholder: "9123 4567", regex: /^\d{8}$/ },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱", length: 9, placeholder: "50 123 4567", regex: /^\d{9}$/ },
];

export function validatePhone(country, rawNumber, required = false) {
  const digits = (rawNumber || "").replace(/\D/g, "");

  if (!digits) {
    if (required) return { isValid: false, error: "Phone number is required" };
    return { isValid: true, error: null };
  }

  if (country.code === "IN") {
    if (digits.length !== 10) {
      return {
        isValid: false,
        error: `Indian mobile number must be exactly 10 digits (${digits.length}/10)`,
      };
    }
    if (!/^[6-9]/.test(digits)) {
      return {
        isValid: false,
        error: "Indian mobile number must begin with 6, 7, 8, or 9",
      };
    }
    return { isValid: true, error: null };
  }

  // General country rule
  if (country.regex && !country.regex.test(digits)) {
    return {
      isValid: false,
      error: `Invalid number for ${country.name} (expected ${country.length} digits)`,
    };
  }

  if (digits.length < 7 || digits.length > 15) {
    return { isValid: false, error: "Phone number must be between 7 and 15 digits" };
  }

  return { isValid: true, error: null };
}

export function parsePhoneNumber(fullNumber) {
  if (!fullNumber) return { country: COUNTRIES[0], localNumber: "" };

  const str = String(fullNumber).trim();

  // Try matching dial codes (longest first to avoid +1 matching +1242)
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (str.startsWith(c.dialCode)) {
      const rest = str.slice(c.dialCode.length).trim().replace(/\D/g, "");
      return { country: c, localNumber: rest };
    }
  }

  // If starts with 10 digits without code, assume default India (+91)
  const onlyDigits = str.replace(/\D/g, "");
  return { country: COUNTRIES[0], localNumber: onlyDigits };
}

export default function PhoneInput({
  label = "Phone number",
  value = "",
  onChange,
  required = false,
  error: externalError,
  helperText,
}) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [touched, setTouched] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const numberInputRef = useRef(null);

  // Sync with incoming value
  useEffect(() => {
    if (value !== undefined) {
      const parsed = parsePhoneNumber(value);
      setSelectedCountry(parsed.country);
      setLocalNumber(parsed.localNumber);
    }
  }, [value]);

  // Handle outside click dismissal
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dropdownOpen]);

  const validation = validatePhone(selectedCountry, localNumber, required);
  const displayError = externalError || (touched && validation.error);
  const isCompleteAndValid = localNumber.length > 0 && validation.isValid;

  const handleCountrySelect = (c) => {
    setSelectedCountry(c);
    setDropdownOpen(false);
    setSearchQuery("");

    // Revalidate and emit
    const full = localNumber ? `${c.dialCode} ${localNumber}` : "";
    const v = validatePhone(c, localNumber, required);
    if (onChange) {
      onChange(full, {
        country: c,
        localNumber,
        isValid: v.isValid,
        error: v.error,
      });
    }
    if (numberInputRef.current) {
      numberInputRef.current.focus();
    }
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    // Allow digits only
    const digitsOnly = raw.replace(/\D/g, "");

    // Enforce max length
    const maxLen = Array.isArray(selectedCountry.length)
      ? Math.max(...selectedCountry.length)
      : (selectedCountry.length || 15);

    const limited = digitsOnly.slice(0, maxLen);
    setLocalNumber(limited);

    const full = limited ? `${selectedCountry.dialCode} ${limited}` : "";
    const v = validatePhone(selectedCountry, limited, required);

    if (onChange) {
      onChange(full, {
        country: selectedCountry,
        localNumber: limited,
        isValid: v.isValid,
        error: v.error,
      });
    }
  };

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} style={{ display: "block", marginBottom: 14 }}>
      {label && (
        <span
          style={{
            display: "block",
            fontFamily: "Inter, sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            color: C.slate,
            marginBottom: 5,
          }}
        >
          {label} {required && <span style={{ color: C.coral }}>*</span>}
        </span>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          border: `1px solid ${displayError ? C.coral : isCompleteAndValid ? C.teal : C.border}`,
          borderRadius: 8,
          background: "#fff",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: displayError
            ? "0 0 0 3px rgba(196,67,47,0.12)"
            : isCompleteAndValid
            ? "0 0 0 2px rgba(31,138,112,0.12)"
            : "none",
        }}
      >
        {/* Country Code Trigger Button */}
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 10px",
            background: C.canvas,
            border: "none",
            borderRight: `1px solid ${C.border}`,
            borderTopLeftRadius: 7,
            borderBottomLeftRadius: 7,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 13.5,
            fontWeight: 600,
            color: C.ink,
            outline: "none",
            flexShrink: 0,
            transition: "background 0.15s ease",
          }}
          title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>{selectedCountry.flag}</span>
          <span style={{ fontSize: 13, color: C.ink }}>{selectedCountry.dialCode}</span>
          <ChevronDown
            size={13}
            color={C.slateLight}
            style={{
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s ease",
            }}
          />
        </button>

        {/* Local Number Input */}
        <input
          ref={numberInputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={localNumber}
          onChange={handleNumberChange}
          onBlur={() => setTouched(true)}
          placeholder={selectedCountry.placeholder || "Enter phone number"}
          style={{
            flex: 1,
            width: "100%",
            border: "none",
            outline: "none",
            padding: "9px 12px",
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            color: C.ink,
            background: "transparent",
            boxSizing: "border-box",
          }}
        />

        {/* Status Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingRight: 10,
            pointerEvents: "none",
          }}
        >
          {isCompleteAndValid ? (
            <Check size={16} color={C.teal} />
          ) : displayError ? (
            <AlertCircle size={16} color={C.coral} />
          ) : null}
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 290,
              maxHeight: 280,
              background: "#fff",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              boxShadow: "0 10px 30px rgba(20,33,61,0.15)",
              zIndex: 300,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Search Box */}
            <div
              style={{
                padding: "8px 10px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.canvas,
              }}
            >
              <Search size={14} color={C.slateLight} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 12.5,
                  fontFamily: "Inter, sans-serif",
                  width: "100%",
                  color: C.ink,
                }}
              />
            </div>

            {/* Countries List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              {filteredCountries.length === 0 ? (
                <div
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontSize: 12.5,
                    color: C.slateLight,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  No country found
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <div
                      key={c.code}
                      onClick={() => handleCountrySelect(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        cursor: "pointer",
                        background: isSelected ? "rgba(31,138,112,0.08)" : "transparent",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: C.ink,
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = C.canvas;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{c.flag}</span>
                      <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400 }}>
                        {c.name}
                      </span>
                      <span
                        style={{
                          color: isSelected ? C.teal : C.slate,
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        {c.dialCode}
                      </span>
                      {isSelected && <Check size={14} color={C.teal} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation / Helper message */}
      {displayError ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            color: C.coral,
            fontSize: 11.5,
            marginTop: 4,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <AlertCircle size={12} />
          <span>{displayError}</span>
        </div>
      ) : helperText ? (
        <div
          style={{
            color: C.slateLight,
            fontSize: 11.5,
            marginTop: 4,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
}
