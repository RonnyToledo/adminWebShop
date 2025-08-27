"use client";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "@/context/useContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { FromData } from "../globalFunction/fromData";
import { useToast } from "../ui/use-toast";
export default function SocialContactPage() {
  const { webshop } = useContext(ThemeContext);
  const [redes, setRedes] = useState([]);
  const [contacto, setContacto] = useState([]);
  const { toast } = useToast();
  useEffect(() => {
    setRedes(webshop?.store?.redes || []);
    setContacto(webshop?.store?.contacto || []);
  }, [webshop?.store?.redes, webshop?.store?.contacto]);

  const [newRed, setNewRed] = useState([]);
  const [newContact, setNewContact] = useState([]);

  const addRed = () => {
    if (newRed.tipo && newRed.url && newRed.user) {
      if ([...contacto, newContact].length >= 4) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Maxima cantidad permitida alcanzada",
        });
      }
      setRedes([...redes, newRed].slice(0, 3));
      setNewRed({});
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Faltan datos",
      });
    }
  };

  const addContact = () => {
    if (newContact.tipo && newContact.url) {
      if ([...contacto, newContact].length >= 4) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Maxima cantidad permitida alcanzada",
        });
      }
      setContacto([...contacto, newContact].slice(0, 3));
      setNewContact({});
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Faltan datos",
      });
    }
  };

  const removeRed = (index) => {
    setRedes(redes?.filter((_, i) => i !== index));
  };

  const removeContact = (index) => {
    setContacto(contacto?.filter((_, i) => i !== index));
  };

  const getRedIcon = (tipo) => {
    switch (tipo) {
      case "insta":
        return <Instagram className="h-4 w-4" />;
      case "face":
        return <Facebook className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkenid":
        return <Linkedin className="h-4 w-4" />;
    }
  };

  const getContactIcon = (tipo) => {
    switch (tipo) {
      case "wa":
        return <MessageCircle className="h-4 w-4" />;
      case "cell":
        return <Phone className="h-4 w-4" />;
      case "mail":
        return <Mail className="h-4 w-4" />;
    }
  };

  const getRedLabel = (tipo) => {
    switch (tipo) {
      case "insta":
        return "Instagram";
      case "face":
        return "Facebook";
      case "twitter":
        return "Twitter";
      case "linkenid":
        return "LinkedIn";
    }
  };

  const getContactLabel = (tipo) => {
    switch (tipo) {
      case "wa":
        return "WhatsApp";
      case "cell":
        return "Teléfono";
      case "mail":
        return "Email";
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <FromData
        store={{ ...webshop?.store, redes, contacto }}
        ThemeContext={ThemeContext}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Redes Sociales y Contacto
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu información de contacto y redes sociales
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Social Networks Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  Redes Sociales
                </CardTitle>
                <CardDescription className="text-pink-100">
                  Agrega tus perfiles de redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Add New Social Network */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
                    Agregar Red Social
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="red-tipo">Tipo de Red</Label>
                      <Select
                        value={newRed.tipo || ""}
                        onValueChange={(value) =>
                          setNewRed({ ...newRed, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una red social" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="insta">Instagram</SelectItem>
                          <SelectItem value="face">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="linkenid">LinkedIn</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="red-user">Usuario</Label>
                      <Input
                        id="red-user"
                        placeholder="@usuario"
                        value={newRed.user || ""}
                        onChange={(e) =>
                          setNewRed({ ...newRed, user: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="red-url">URL</Label>
                      <Input
                        id="red-url"
                        placeholder="https://..."
                        value={newRed.url || ""}
                        onChange={(e) =>
                          setNewRed({ ...newRed, url: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      onClick={addRed}
                      type="button"
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Red Social
                    </Button>
                  </div>
                </div>

                {/* Social Networks List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Redes Configuradas ({redes?.length})
                  </h3>

                  {redes?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay redes sociales configuradas
                    </p>
                  ) : (
                    redes?.map((red, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          {getRedIcon(red.tipo)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {getRedLabel(red.tipo)}
                            </p>
                            <p className="text-sm text-gray-600">{red.user}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRed(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Información de Contacto
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Agrega tus métodos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Add New Contact */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900">
                    Agregar Contacto
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="contact-tipo">Tipo de Contacto</Label>
                      <Select
                        value={newContact.tipo || ""}
                        onValueChange={(value) =>
                          setNewContact({ ...newContact, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo de contacto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wa">WhatsApp</SelectItem>
                          <SelectItem value="cell">Teléfono</SelectItem>
                          <SelectItem value="mail">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contact-url">URL/Número/Email</Label>
                      <Input
                        id="contact-url"
                        placeholder="Ingresa la información de contacto"
                        value={newContact.url || ""}
                        onChange={(e) =>
                          setNewContact({ ...newContact, url: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addContact}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Contacto
                    </Button>
                  </div>
                </div>

                {/* Contact List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">
                    Contactos Configurados ({contacto?.length})
                  </h3>
                  {(webshop?.store?.email || webshop?.store?.cell) && (
                    <h6 className="font-semibold text-gray-600">
                      Ya existe por defecto
                      {webshop.store.email && (
                        <>
                          <br />
                          email: {webshop.store.email}
                        </>
                      )}
                      {webshop.store.cell && (
                        <>
                          <br />
                          wa: {webshop.store.cell}
                        </>
                      )}
                    </h6>
                  )}

                  {contacto?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No hay contactos configurados
                    </p>
                  ) : (
                    contacto?.map((contact, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          {getContactIcon(contact.tipo)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {getContactLabel(contact.tipo)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {contact.url}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FromData>
    </div>
  );
}
