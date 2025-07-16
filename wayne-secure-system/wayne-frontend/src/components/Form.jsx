
import React, { useState } from "react";

export default function Form({ fields, onSubmit }) {
  const [values, setValues] = useState({});

  function handleChange(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input
            type={field.type || "text"}
            name={field.name}
            value={values[field.name] || ""}
            onChange={handleChange}
            required={field.required}
          />
        </div>
      ))}
      <button type="submit">Enviar</button>
    </form>
  );
}
