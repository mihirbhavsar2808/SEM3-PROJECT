import React, { useEffect, useState } from "react";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import "./SubscriptionPage.css";
import { getPlans, subscribeToPlan, getMySubscription } from "../api/subscriptionApi";

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, subData] = await Promise.allSettled([
          getPlans(),
          getMySubscription(),
        ]);

        if (plansData.status === "fulfilled" && Array.isArray(plansData.value)) {
          const sorted = [...plansData.value].sort(
            (a, b) => parseFloat(a.price) - parseFloat(b.price)
          );
          setPlans(sorted);
        }

        if (subData.status === "fulfilled" && subData.value?.plan) {
          setCurrentSubscription(subData.value);
        }
      } catch (err) {
        console.error("Failed to load subscription data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async (plan) => {
    setSubscribing(plan.id);
    setMessage(null);

    try {
      const result = await subscribeToPlan(plan.id);
      setCurrentSubscription(result);
      setMessage({
        type: "success",
        text: `🎉 Successfully subscribed to the ${plan.name}! All workforce features are unlocked.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Subscription failed. Please try again.",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const isPopular = (name) =>
    name?.toLowerCase().includes("professional") ||
    name?.toLowerCase().includes("premium");

  const isCurrentPlan = (plan) =>
    currentSubscription?.plan?.id === plan.id &&
    currentSubscription?.is_active;

  const renderFeatures = (desc) => {
    if (!desc) return null;
    const lines = desc
      .split("\n")
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);

    return (
      <ul className="plan-features">
        {lines.map((feature, idx) => (
          <li key={idx}>
            <Check size={16} className="feature-check" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="subscription-header">
          <h1>Choose Your Plan</h1>
          <p>Loading available plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h1>Subscription Plans</h1>
        <p>Choose the right plan for your organization. Start free and scale anytime.</p>
      </div>

      {currentSubscription?.is_active && (
        <div className="current-plan-banner">
          <ShieldCheck size={18} />
          <span>
            You are currently on the <strong>{currentSubscription.plan.name}</strong>, active until{" "}
            <strong>{new Date(currentSubscription.end_date).toLocaleDateString()}</strong>.
          </span>
        </div>
      )}

      {message && (
        <div className={`subscription-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="subscription-container">
        {plans.map((plan) => {
          const priceNum = parseFloat(plan.price);
          const isFree = priceNum === 0;
          const isCurrent = isCurrentPlan(plan);
          const popular = isPopular(plan.name);

          return (
            <div
              className={`subscription-card ${popular ? "popular-plan" : ""} ${
                isCurrent ? "current-plan" : ""
              }`}
              key={plan.id}
            >
              {isCurrent && (
                <div className="current-badge">
                  <ShieldCheck size={13} /> Active Plan
                </div>
              )}
              {!isCurrent && popular && (
                <div className="popular-badge">
                  <Sparkles size={13} /> Most Popular
                </div>
              )}
              {!isCurrent && !popular && (isFree || plan.is_default) && (
                <div className="default-badge">Default Free</div>
              )}

              <h2>{plan.name}</h2>

              <div className="plan-price">
                {isFree ? (
                  <>
                    <span className="free-price">₹0</span>
                    <small>/ Free Forever</small>
                  </>
                ) : (
                  <>
                    <span>₹{priceNum.toLocaleString("en-IN")}</span>
                    <small>
                      /{plan.duration_months === 1 ? "month" : `${plan.duration_months} mo`}
                    </small>
                  </>
                )}
              </div>

              {renderFeatures(plan.description)}

              <button
                onClick={() => handleSubscribe(plan)}
                className="subscribe-btn"
                disabled={subscribing === plan.id || isCurrent}
              >
                {subscribing === plan.id
                  ? "Processing..."
                  : isCurrent
                  ? "Current Active Plan"
                  : currentSubscription?.is_active
                  ? isFree
                    ? "Downgrade to Free"
                    : "Upgrade to Plan"
                  : isFree
                  ? "Start for Free"
                  : "Subscribe Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPage;