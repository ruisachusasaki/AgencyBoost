import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, BookOpen, Eye, Heart, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["/api/knowledge-base/categories"],
  });

  const { data: articles } = useQuery({
    queryKey: ["/api/knowledge-base/articles", { search: searchTerm, categoryId: selectedCategory }],
  });

  const filteredArticles = articles?.filter((article: any) => {
    if (!searchTerm) return true;
    return article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Find answers, guides, and documentation
          </p>
        </div>
        <Button data-testid="button-create-article">
          <Plus className="w-4 h-4 mr-2" />
          Create Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          data-testid="input-search"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  data-testid="button-category-all"
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategory === null 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  All Articles
                </button>
                {categories?.map((category: any) => (
                  <button
                    key={category.id}
                    data-testid={`button-category-${category.id}`}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      {category.articleCount && (
                        <Badge variant="secondary" className="text-xs">
                          {category.articleCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {filteredArticles?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No articles found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "Try adjusting your search terms" : "No articles have been created yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredArticles?.map((article: any) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/resources/articles/${article.id}`}>
                          <h3 className="text-lg font-semibold hover:text-primary cursor-pointer mb-2">
                            {article.title}
                          </h3>
                        </Link>
                        {article.excerpt && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {article.authorName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(article.createdAt), 'MMM d, yyyy')}
                          </div>
                          {article.viewCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {article.viewCount}
                            </div>
                          )}
                          {article.likeCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {article.likeCount}
                            </div>
                          )}
                        </div>
                      </div>
                      {article.featuredImage && (
                        <img 
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-md ml-4"
                        />
                      )}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex gap-2 flex-wrap">
                          {article.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}