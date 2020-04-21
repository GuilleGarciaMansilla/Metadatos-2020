package com.metadatos.imagenes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;


@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class Item {
	private String nombre;
	private String apellidos;
	
	public Item(){}
	public Item(String nombre, String apellidos) {
		super();
		this.nombre = nombre;
		this.apellidos = apellidos;
	}
	@Override
	public String toString() {
		return "Item [nombre=" + nombre + ", apellidos=" + apellidos + "]";
	}
	public String getNombre() {
		return nombre;
	}
	public void setNombre(String nombre) {
		this.nombre = nombre;
	}
	public String getApellidos() {
		return apellidos;
	}
	public void setApellidos(String apellidos) {
		this.apellidos = apellidos;
	}
	
}
